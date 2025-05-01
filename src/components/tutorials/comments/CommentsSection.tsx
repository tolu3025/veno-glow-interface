
import { useComments } from './useComments';
import CommentsList from './CommentsList';
import CommentForm from '../CommentForm';

interface CommentsSectionProps {
  tutorialId: string;
}

const CommentsSection = ({ tutorialId }: CommentsSectionProps) => {
  const {
    isLoading,
    isSubmitting,
    replyingTo,
    setReplyingTo,
    handleSubmitComment,
    handleReply,
    handleDeleteComment,
    organizeComments
  } = useComments(tutorialId);

  const { parentComments, getChildComments } = organizeComments();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Comments</h3>
      
      {!replyingTo && (
        <CommentForm 
          onSubmit={handleSubmitComment}
          isSubmitting={isSubmitting}
        />
      )}
      
      <div className="space-y-6 mt-6">
        {isLoading ? (
          <p className="text-center py-4">Loading comments...</p>
        ) : parentComments.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No comments yet. Be the first to comment!</p>
        ) : (
          <CommentsList
            comments={parentComments}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            handleSubmitComment={handleSubmitComment}
            handleReply={handleReply}
            isSubmitting={isSubmitting}
            handleDeleteComment={handleDeleteComment}
            getChildComments={getChildComments}
          />
        )}
      </div>
    </div>
  );
};

export default CommentsSection;
