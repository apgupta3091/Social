package main

import (
	"log"

	"github.com/apgupta3091/social/internal/env"
	"github.com/apgupta3091/social/internal/store"
)

func main() {
	store := store.NewStorage(nil)
	
	cfg := config {
		addr: env.GetString("ADDR", ":8080"),
		store: store,
	}

	app := &application {
		config: cfg,
	}


	mux := app.mount()
	log.Fatal(app.run(mux))
}
