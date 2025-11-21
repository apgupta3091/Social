package main

import (
	"net/http"

	"github.com/apgupta3091/social/internal/store"
)

func (app *application) createCommentHandler(w http.ResponseWriter, r *http.Request) {
	// Get post from context (validated by postContextMiddleware)
	post := getPostFromCtx(r)

	type createCommentPayload struct {
		UserID  int64  `json:"user_id" validate:"required"`
		Content string `json:"content" validate:"required,max=100"`
	}

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
