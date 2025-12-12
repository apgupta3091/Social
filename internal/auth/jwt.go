package auth

type JWTAuthenticator struct {
	secret string
	aud    string
	iss    string
}

func NewJWTAuthenticator(secret, aud, iss string) JWTAuthenticator {
	return JWTAuthenticator{secret, iss, aud}
}
