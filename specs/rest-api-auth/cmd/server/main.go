// Package main is a minimal REST auth server for the spec fixture.
package main

import (
	"encoding/json"
	"net/http"

	"example.com/rest-api-auth/auth"
)

type registerReq struct {
	Username string `json:"username"`
	Password string `json:"password"`
}
type loginReq struct {
	Username string `json:"username"`
	Password string `json:"password"`
}
type tokenResp struct {
	Token string `json:"token"`
}
type verifyResp struct {
	Username string `json:"username"`
}

func main() {
	store := auth.NewStore()

	http.HandleFunc("/register", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		var req registerReq
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		tok, err := store.Register(req.Username, req.Password)
		if err == auth.ErrExists {
			w.WriteHeader(http.StatusConflict)
			return
		}
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(tokenResp{Token: tok})
	})

	http.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		var req loginReq
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		tok, err := store.Login(req.Username, req.Password)
		if err == auth.ErrNotFound {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(tokenResp{Token: tok})
	})

	http.HandleFunc("/verify", func(w http.ResponseWriter, r *http.Request) {
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
		if err == auth.ErrNotFound {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(verifyResp{Username: name})
	})

	http.ListenAndServe(":8080", nil)
}