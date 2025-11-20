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

var titles = []string{
	"launch day",
	"quick update",
	"new feature",
	"bug fixes",
	"team notes",
	"dev recap",
	"next steps",
	"weekly wrap",
	"release prep",
	"testing done",
	"prod ready",
	"design kickoff",
	"api changes",
	"hot patch",
	"roadmap drop",
	"refactor log",
	"infra upgrade",
	"db migration",
	"sprint start",
	"final tweaks",
}

var contents = []string{
	"pushing a small update live today",
	"fixed a couple annoying bugs",
	"working on something new and fun",
	"today was all about refactoring code",
	"shipped a feature I've wanted for weeks",
	"testing went smoother than expected",
	"taking a break before the next sprint",
	"built a draft version of a new idea",
	"performance improvements across the board",
	"finally wrapped up this long task",
	"started exploring a new approach today",
	"team synced up and aligned on goals",
	"cleaned up tech debt all morning",
	"small win but feels great",
	"pushing another patch tonight",
	"thinking about redesigning parts of the system",
	"running load tests again just to be safe",
	"planning tomorrow’s work now",
	"happy with the progress today",
	"excited to share more soon",
}

var tags = []string{
	"update",
	"release",
	"devlog",
	"bugfix",
	"refactor",
	"feature",
	"backend",
	"frontend",
	"testing",
	"infra",
}

var comments = []string{
	"nice work!",
	"looks great!",
	"love this update",
	"keep it up!",
	"awesome progress",
	"clean and smooth",
	"this is solid",
	"great improvement",
	"really like this",
	"super helpful",
	"big fan of this",
	"well done!",
	"this is dope",
	"let’s go!",
	"strong update",
	"great job here",
	"very cool",
	"this helps a lot",
	"keep pushing",
	"love the momentum",
}

func Seed(store store.Storage) {
	ctx := context.Background()

	users := generateUsers(100)
	for _, user := range users {
		if err := store.Users.Create(ctx, user); err != nil {
			log.Println("Error creating user", err)
		}
	}

	posts := generatePosts(200, users)
	for _, post := range posts {
		if err := store.Posts.Create(ctx, post); err != nil {
			log.Println("Error creating post", err)
		}
	}

	comments := generateComments(500, posts, users)
	for _, comment := range comments {
		if err := store.Comments.Create(ctx, comment); err != nil {
			log.Println("Error creating comments", err)
		}
	}

	log.Println("Seeding completed")
}

func generateUsers(num int) []*store.User {
	users := make([]*store.User, num)

	for i := 0; i < num; i++ {
		users[i] = &store.User{
			Username: usernames[i%len(usernames)] + fmt.Sprintf("%d", i),
			Email:    usernames[i%len(usernames)] + fmt.Sprintf("%d", i) + "@example.com",
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
			Title:   titles[rand.IntN(len(titles))],
			Content: contents[rand.IntN(len(contents))],
			Tags: []string{
				tags[rand.IntN(len(tags))],
				tags[rand.IntN(len(tags))],
			},
		}
	}
	return posts
}

func generateComments(num int, posts []*store.Post, users []*store.User) []*store.Comment {
	cms := make([]*store.Comment, num)
	for i := 0; i < num; i++ {
		cms[i] = &store.Comment{
			PostID:  posts[rand.IntN(len(posts))].ID,
			UserID:  users[rand.IntN(len(users))].ID,
			Content: comments[rand.IntN(len(comments))],
		}
	}
	return cms
}
