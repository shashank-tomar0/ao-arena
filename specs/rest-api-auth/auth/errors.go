package auth

var (
	ErrExists   = &authError{"user exists"}
	ErrNotFound = &authError{"not found"}
)

type authError struct {
	msg string
}

func (e *authError) Error() string { return e.msg }