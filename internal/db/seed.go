package db

import (
	"context"
	"fmt"
	"log"
	"math/rand/v2"

	"github.com/apgupta3091/social/internal/store"
)

var usernames = []string{
	"bob",
	"alex",
	"sam",
	"mike",
	"john",
	"dave",
	"luke",
	"mark",
	"paul",
	"tom",
	"jake",
	"ryan",
	"ben",
	"chris",
	"dan",
	"eric",
	"adam",
	"nate",
	"kyle",
	"tyler",
	"jack",
	"noah",
	"liam",
	"owen",
	"max",
	"joel",
	"eli",
	"grant",
	"will",
	"cole",
	"sean",
	"tony",
	"gary",
	"logan",
	"evan",
	"aaron",
	"brian",
	"jason",
	"kevin",
	"shawn",
	"seth",
	"jordan",
	"ian",
	"trent",
	"chad",
	"brad",
	"henry",
	"clay",
	"victor",
}

func seed(store store.Storage) {
	ctx := context.Background()

	users := generateUsers(100)
	for _, user := range users {
		if err := store.Users.Create(ctx, user); err != nil {
			log.Println("Error creating user", err)
		}
	}

	posts := generatePosts(200, users)

	return
}

func generateUsers(num int) []*store.User {
	users := make([]*store.User, num)

	for i := 0; i < num; i++ {
		users[i] = &store.User{
			Username: usernames[i&len(usernames)] + fmt.Sprintf("%d", i),
			Email:    usernames[i&len(usernames)] + fmt.Sprintf("%d", i) + "@example.com",
			Password: "123123",
		}
	}

	return users
}

func generatePosts(num int, users []*store.User) []*store.Post {
	posts := make([]*store.Post, num)
	for i := 0; i < num; i++ {
		user := users[rand.IntN(len(users))]
		posts[i] = &store.Post{
			UserID:  user.ID,
			Title:   "",
			Content: "",
			Tags:    []string{},
		}
	}
	return posts
}
