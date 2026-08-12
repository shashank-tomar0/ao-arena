// Package auth implements a simple token-based auth store.
package auth

import (
	"crypto/sha256"
	"encoding/hex"
	"sync"
)

// User is a registered user.
type User struct {
	Username     string
	PasswordHash string
	Token        string
}

// Store holds registered users.
type Store struct {
	mu    sync.Mutex
	users map[string]User
}

// NewStore returns an empty store.
func NewStore() *Store {
	return &Store{users: map[string]User{}}
}

func hashPassword(password string) string {
	sum := sha256.Sum256([]byte(password))
	return hex.EncodeToString(sum[:])
}

// Register adds a user and returns their token.
func (s *Store) Register(username, password string) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.users[username]; ok {
		return "", ErrExists
	}
	token := "tok-" + username
	s.users[username] = User{
		Username:     username,
		PasswordHash: hashPassword(password),
		Token:        token,
	}
	return token, nil
}

// Login returns the token for a valid user.
func (s *Store) Login(username, password string) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	u, ok := s.users[username]
	if !ok {
		return "", ErrNotFound
	}
	if u.PasswordHash != hashPassword(password) {
		return "", ErrNotFound
	}
	return u.Token, nil
}

// Verify checks a token and returns the owning username.
func (s *Store) Verify(token string) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for name, u := range s.users {
		if u.Token == token {
			return name, nil
		}
	}
	return "", ErrNotFound
}