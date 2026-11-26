-- Pending and Withdrawn are the only states without an assigned reviewer.
ALTER TABLE "Request" DROP CONSTRAINT "request_reviewer_matches_state";
ALTER TABLE "Request" ADD CONSTRAINT "request_reviewer_matches_state"
  CHECK (("state" IN ('PENDING', 'WITHDRAWN')) = ("reviewerId" IS NULL));
