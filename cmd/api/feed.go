package main

import (
	"net/http"

	"github.com/apgupta3091/social/internal/store"
)

// GetUserFeed godoc
//
//	@Summary		Fetches user feed
//	@Description	Fetches a paginated feed of posts from followed users and own posts
//	@Tags			users
//	@Accept			json
//	@Produce		json
//	@Param			limit	query		int						false	"Limit (1-20)"			default(20)
//	@Param			offset	query		int						false	"Offset"				default(0)
//	@Param			sort	query		string					false	"Sort order (asc/desc)"	Enums(asc, desc)	default(desc)
//	@Success		200		{array}		store.PostWithMetadata	"Feed posts"
//	@Failure		400		{object}	error					"Invalid query parameters"
//	@Failure		500		{object}	error					"Internal server error"
//	@Security		ApiKeyAuth
//	@Router			/users/feed [get]
func (app *application) getUserFeedHandler(w http.ResponseWriter, r *http.Request) {

	fq := store.PaginatedFeedQuery{
		Limit:  20,
		Offset: 0,
		Sort:   "desc",
	}

	fq, err := fq.Parse(r)
	if err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(fq); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	ctx := r.Context()

	feed, err := app.store.Posts.GetUserFeed(ctx, int64(220), fq)
	if err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusOK, feed); err != nil {
		app.internalServerError(w, r, err)
	}
}
