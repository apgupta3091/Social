package main

import (
	"log"

	"github.com/apgupta3091/social/internal/db"
	"github.com/apgupta3091/social/internal/env"
	"github.com/apgupta3091/social/internal/store"
)

func main() {
	addr := env.GetString("DB_ADDR", "postgres://admin:adminpassword@localhost/socialnetwork?sslmode=disable")
	conn, err := db.New(addr, 3, 3, "15m")
	if err != nil {
		log.Fatal(err)
	}

	defer conn.Close()

	store := store.NewStorage(conn)
	db.Seed(store)
}
