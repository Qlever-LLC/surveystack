import { type Request, type Response, type NextFunction } from 'express';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convertSubmissionVXtoV4 = (submission: any): any => {
  if (submission.meta.specVersion < 4) {
    if (submission.meta.archivedReason === 'SUBMISSION_FROM_BUILDER') {
      submission.meta.isDraft = false;
      submission.meta.isDeletedDraft = false;
      submission.meta.specVersion = 4;
      return;
    }
    submission.meta.isDraft = submission.meta.dateSubmitted ? false : true;
    submission.meta.isDeletedDraft = false;
    submission.meta.specVersion = 4;
  }
};

// If we encounter an outdated submission in a request, we need to convert it to the latest specVersion.
const submissionMigration = async (req: Request, res: Response, next: NextFunction) => {
  const submissions = Array.isArray(req.body) ? req.body : [req.body];
  submissions.forEach(convertSubmissionVXtoV4);
  next();
};

export default submissionMigration;
