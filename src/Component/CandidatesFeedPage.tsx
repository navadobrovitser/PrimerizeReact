
import { useEffect, useMemo, useState } from "react";

import {
  useAppDispatch,
  useAppSelector,
} from "../store/hooks";

import {
  fetchPosts,
  fetchPostById,
} from "../store/posts/postsThunks";

import {
  clearSelectedPost,
  clearPostsError,
} from "../store/posts/postsSlice";

import CandidatePost from "./CandidatePost";

import "./CandidatesFeedPage.css";

// =====================================
// TYPES
// =====================================

interface CandidatesFeedPageProps {
  selectedPostId?: number | null;
  isCandidate?: boolean;
  onCreatePost?: () => void;
  onClearSelectedPost?: () => void;
  onBackToNews?: () => void;
}

// =====================================
// COMPONENT
// =====================================

export function CandidatesFeedPage({
  selectedPostId = null,
  isCandidate = false,
  onCreatePost,
  onClearSelectedPost,
  onBackToNews,
}: CandidatesFeedPageProps) {
  const dispatch = useAppDispatch();

  const {
    items: posts,
    loading,
    error,
    selectedPost,
    selectedPostLoading,
    selectedPostError,
  } = useAppSelector(
    (state) => state.posts
  );

  // =====================================
  // מספר עמודות לפי רוחב מסך
  // =====================================

  const [columnCount, setColumnCount] =
    useState(() => {
      if (typeof window === "undefined") {
        return 3;
      }

      if (window.innerWidth <= 650) {
        return 1;
      }

      if (window.innerWidth <= 1100) {
        return 2;
      }

      return 3;
    });

  const isSinglePost =
    selectedPostId !== null &&
    selectedPostId !== undefined;

  // =====================================
  // התאמה למסכים
  // =====================================

  useEffect(() => {
    const updateColumns = () => {
      if (window.innerWidth <= 650) {
        setColumnCount(1);
      } else if (
        window.innerWidth <= 1100
      ) {
        setColumnCount(2);
      } else {
        setColumnCount(3);
      }
    };

    updateColumns();

    window.addEventListener(
      "resize",
      updateColumns
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateColumns
      );
    };
  }, []);

  // =====================================
  // טעינת פוסטים
  // =====================================

  useEffect(() => {
    if (selectedPostId != null) {
      dispatch(clearPostsError());

      const request = dispatch(
        fetchPostById(selectedPostId)
      );

      return () => {
        request.abort();
      };
    }

    dispatch(clearSelectedPost());

    const request = dispatch(
      fetchPosts()
    );

    return () => {
      request.abort();
    };
  }, [dispatch, selectedPostId]);

  // =====================================
  // מיון מהחדש לישן
  // =====================================

  const sortedPosts = useMemo(() => {
    return [...posts].sort(
      (a, b) => {
        const dateA = new Date(
          a.createdAt ?? 0
        ).getTime();

        const dateB = new Date(
          b.createdAt ?? 0
        ).getTime();

        return (
          dateB - dateA ||
          b.postId - a.postId
        );
      }
    );
  }, [posts]);

  // =====================================
  // חלוקה לעמודות עצמאיות
  // =====================================

  const postColumns = useMemo(() => {
    const columns: typeof sortedPosts[] =
      Array.from(
        { length: columnCount },
        () => []
      );

    sortedPosts.forEach(
      (post, index) => {
        columns[
          index % columnCount
        ].push(post);
      }
    );

    return columns;
  }, [
    sortedPosts,
    columnCount,
  ]);

  // =====================================
  // פוסט בודד
  // =====================================

  if (isSinglePost) {
    return (
      <div
        className="candidates-feed-page"
        dir="rtl"
      >
        <div className="candidates-feed-heading">
          <span>
            תנופה | הקול של המועמדים
          </span>

          <h1>הפוסט המלא</h1>

          <div className="single-post-navigation">
            {onBackToNews && (
              <button
                type="button"
                className="single-post-back-button"
                onClick={onBackToNews}
              >
                חזרה לחדשות ועדכונים
              </button>
            )}

            {onClearSelectedPost && (
              <button
                type="button"
                className="single-post-all-button"
                onClick={
                  onClearSelectedPost
                }
              >
                הצגת כל הפוסטים
              </button>
            )}
          </div>
        </div>

        {selectedPostLoading ? (
          <p className="posts-status">
            טוען את הפוסט...
          </p>
        ) : selectedPostError ? (
          <p
            className="posts-error"
            role="alert"
          >
            {selectedPostError}
          </p>
        ) : selectedPost &&
          Number(
            selectedPost.postId
          ) === Number(
            selectedPostId
          ) ? (
          <div className="single-post-list">
            <CandidatePost
              key={
                selectedPost.postId
              }
              post={
                selectedPost
              }
              initiallyExpanded={true}
            />
          </div>
        ) : (
          <p className="posts-status">
            הפוסט המבוקש לא נמצא.
          </p>
        )}
      </div>
    );
  }

  // =====================================
  // כל הפוסטים
  // =====================================

  return (
    <div
      className="candidates-feed-page"
      dir="rtl"
    >
      {/* כותרת */}
      <div className="candidates-feed-heading">
        <span>
          תנופה | הקול של המועמדים
        </span>

        <h1>
          הפוסטים של המועמדים
        </h1>

        <p>
          כאן תוכלו להתעדכן בפעילות
          המועמדים, לקרוא את הפוסטים
          ולהכיר את העשייה שלהם.
        </p>

        {/* מעבר לעמוד הוספת פוסט */}
        {isCandidate && onCreatePost && (
          <button
            type="button"
            className="add-post-button"
            onClick={
              onCreatePost
            }
          >
            + הוספת פוסט
          </button>
        )}
      </div>

      {/* שגיאות */}
      {error && (
        <p
          className="posts-error"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* רשימת הפוסטים */}
      {loading ? (
        <p className="posts-status">
          טוען פוסטים מהשרת...
        </p>
      ) : posts.length === 0 ? (
        <p className="posts-status">
          עדיין אין פוסטים להצגה.
        </p>
      ) : (
        <div
          className="candidates-posts-list"
          style={{
            gridTemplateColumns:
              `repeat(${columnCount}, minmax(0, 1fr))`,
          }}
        >
          {postColumns.map(
            (
              columnPosts,
              columnIndex
            ) => (
              <div
                className="candidate-post-column"
                key={
                  columnIndex
                }
              >
                {columnPosts.map(
                  (post) => (
                    <CandidatePost
                      key={
                        post.postId
                      }
                      post={post}
                      initiallyExpanded={
                        false
                      }
                    />
                  )
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default CandidatesFeedPage;
