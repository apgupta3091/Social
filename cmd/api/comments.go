package main

import (
	"net/http"

	"github.com/apgupta3091/social/internal/store"
)

type createCommentPayload struct {
	UserID  int64  `json:"user_id" validate:"required"`
	Content string `json:"content" validate:"required,max=100"`
}

// CreateComment godoc
//
//	@Summary		Creates a comment on a post
//	@Description	Creates a new comment on a post by post ID
//	@Tags			comments
//	@Accept			json
//	@Produce		json
//	@Param			postID	path		int						true	"Post ID"
//	@Param			comment	body		createCommentPayload	true	"Comment creation payload"
//	@Success		201		{object}	store.Comment			"Created comment"
//	@Failure		400		{object}	error					"Invalid payload"
//	@Failure		404		{object}	error					"Post not found"
//	@Failure		500		{object}	error					"Internal server error"
//	@Security		ApiKeyAuth
//	@Router			/posts/{postID}/comments [post]
func (app *application) createCommentHandler(w http.ResponseWriter, r *http.Request) {
	// Get post from context (validated by postContextMiddleware)
	post := getPostFromCtx(r)

	var payload createCommentPayload

	if err := readJSON(w, r, &payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	if err := Validate.Struct(payload); err != nil {
		app.badRequestResponse(w, r, err)
		return
	}

	comment := &store.Comment{
		UserID:  payload.UserID,
		PostID:  post.ID,
		Content: payload.Content,
	}

	ctx := r.Context()

	if err := app.store.Comments.Create(ctx, comment); err != nil {
		app.internalServerError(w, r, err)
		return
	}

	if err := app.jsonResponse(w, http.StatusCreated, comment); err != nil {
		app.internalServerError(w, r, err)
		return
	}
}
