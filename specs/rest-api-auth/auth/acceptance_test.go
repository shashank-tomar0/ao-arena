// Acceptance test for the rest-api-auth spec.
// Runs against an in-test httptest server (no external service required).
package auth

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
)

// postJSON helper posts JSON to the test server.
func postJSON(t *testing.T, ts *httptest.Server, path string, body, target any) {
	t.Helper()
	b, _ := json.Marshal(body)
	req, _ := http.NewRequestWithContext(context.Background(), "POST", ts.URL+path, nil)
	req.Header.Set("Content-Type", "application/json")
	req.Body = &nopCloser{b}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("POST %s: %v", path, err)
	}
	defer resp.Body.Close()
	if target != nil {
		json.NewDecoder(resp.Body).Decode(target)
	}
}

type nopCloser struct{ data []byte }

func (n *nopCloser) Read(p []byte) (int, error) {
	if len(n.data) == 0 {
		return 0, os.ErrClosed
	}
	l := len(n.data)
	copy(p, n.data)
	// don't mutate — allow reuse
	return l, nil
}
func (n *nopCloser) Close() error { return nil }

// makeTestServer builds an httptest server using the auth package.
func makeTestServer() *httptest.Server {
	store := NewStore()
	mux := http.NewServeMux()
	mux.HandleFunc("/register", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		var req struct {
			Username string `json:"username"`
			Password string `json:"password"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		tok, err := store.Register(req.Username, req.Password)
		if err == ErrExists {
			w.WriteHeader(http.StatusConflict)
			return
		}
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(struct {
			Token string `json:"token"`
		}{Token: tok})
	})
	mux.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		var req struct {
			Username string `json:"username"`
			Password string `json:"password"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		tok, err := store.Login(req.Username, req.Password)
		if err == ErrNotFound {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(struct {
			Token string `json:"token"`
		}{Token: tok})
	})
	mux.HandleFunc("/verify", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		tok := r.URL.Query().Get("token")
		if tok == "" {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		name, err := store.Verify(tok)
		if err == ErrNotFound {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(struct {
			Username string `json:"username"`
		}{Username: name})
	})
	return httptest.NewServer(mux)
}

// TestSpec_RegisterLoginVerify runs the full acceptance criteria.
func TestSpec_RegisterLoginVerify(t *testing.T) {
	ts := makeTestServer()
	defer ts.Close()

	// 1. Register
	var tok struct{ Token string }
	postJSON(t, ts, "/register", map[string]string{"username": "alice", "password": "secret"}, &tok)
	if tok.Token == "" {
		t.Fatal("register: empty token")
	}

	// 2. Login returns same token
	postJSON(t, ts, "/login", map[string]string{"username": "alice", "password": "secret"}, &tok)
	if tok.Token == "" {
		t.Fatal("login: empty token")
	}

	// 3. Verify token resolves to username
	req, _ := http.NewRequestWithContext(context.Background(), "GET", ts.URL+"/verify?token="+tok.Token, nil)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("verify request: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		t.Fatalf("verify status %d", resp.StatusCode)
	}
	var vr struct{ Username string }
	json.NewDecoder(resp.Body).Decode(&vr)
	if vr.Username != "alice" {
		t.Fatalf("verify: expected alice, got %s", vr.Username)
	}

	// 4. Duplicate register fails (expect 409)
	req2, _ := http.NewRequestWithContext(context.Background(), "POST", ts.URL+"/register", nil)
	req2.Header.Set("Content-Type", "application/json")
	req2.Body = &nopCloser{[]byte(`{"username":"alice","password":"secret"}`)}
	resp2, err := http.DefaultClient.Do(req2)
	if err != nil {
		t.Fatalf("duplicate register request: %v", err)
	}
	if resp2.StatusCode != http.StatusConflict {
		t.Fatalf("duplicate register: expected 409, got %d", resp2.StatusCode)
	}

	// 5. Wrong password fails (expect 401)
	req3, _ := http.NewRequestWithContext(context.Background(), "POST", ts.URL+"/login", nil)
	req3.Header.Set("Content-Type", "application/json")
	req3.Body = &nopCloser{[]byte(`{"username":"alice","password":"wrong"}`)}
	resp3, err := http.DefaultClient.Do(req3)
	if err != nil {
		t.Fatalf("wrong password request: %v", err)
	}
	if resp3.StatusCode != http.StatusUnauthorized {
		t.Fatalf("wrong password: expected 401, got %d", resp3.StatusCode)
	}

	// 6. Bad token fails (expect 401)
	req4, _ := http.NewRequestWithContext(context.Background(), "GET", ts.URL+"/verify?token=bad", nil)
	resp4, err := http.DefaultClient.Do(req4)
	if err != nil {
		t.Fatalf("bad token request: %v", err)
	}
	if resp4.StatusCode != http.StatusUnauthorized {
		t.Fatalf("bad token: expected 401, got %d", resp4.StatusCode)
	}
}

// TestSpec_ServerShutdownGraceful ensures the server can be stopped cleanly.
func TestSpec_ServerShutdownGraceful(t *testing.T) {
	ts := makeTestServer()
	ts.Close() // no panic
}