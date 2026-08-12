package auth

import (
	"testing"
)

func TestStore_RegisterCreatesUser(t *testing.T) {
	s := NewStore()
	token, err := s.Register("alice", "secret")
	if err != nil {
		t.Fatalf("Register: %v", err)
	}
	if token == "" {
		t.Fatal("token empty")
	}
}

func TestStore_RegisterDuplicateReturnsError(t *testing.T) {
	s := NewStore()
	_, _ = s.Register("alice", "secret")
	_, err := s.Register("alice", "other")
	if err == nil {
		t.Fatal("expected ErrExists on duplicate register")
	}
	if err != ErrExists {
		t.Fatalf("expected ErrExists, got %v", err)
	}
}

func TestStore_LoginReturnsToken(t *testing.T) {
	s := NewStore()
	_, _ = s.Register("bob", "secret")
	token, err := s.Login("bob", "secret")
	if err != nil {
		t.Fatalf("Login: %v", err)
	}
	if token == "" {
		t.Fatal("token empty")
	}
}

func TestStore_LoginWrongCredentialsFails(t *testing.T) {
	s := NewStore()
	_, _ = s.Register("bob", "secret")
	_, err := s.Login("bob", "wrong")
	if err == nil {
		t.Fatal("expected ErrNotFound on wrong password")
	}
	if err != ErrNotFound {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}

func TestStore_VerifyValidToken(t *testing.T) {
	s := NewStore()
	_, _ = s.Register("carol", "secret")
	tok, _ := s.Login("carol", "secret")
	name, err := s.Verify(tok)
	if err != nil {
		t.Fatalf("Verify: %v", err)
	}
	if name != "carol" {
		t.Fatalf("expected carol, got %s", name)
	}
}

func TestStore_VerifyInvalidToken(t *testing.T) {
	s := NewStore()
	name, err := s.Verify("tok-nonexistent")
	if err == nil {
		t.Fatal("expected ErrNotFound on bad token")
	}
	if err != ErrNotFound {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
	if name != "" {
		t.Fatalf("expected empty name, got %s", name)
	}
}