-- The existing reviewer/state invariant already retains a reviewer for RETURNED.
ALTER TABLE "Request" ADD CONSTRAINT "request_return_reason"
CHECK ("state" <> 'RETURNED' OR
  ("decisionReason" IS NOT NULL AND "decisionReason" ~ '[^[:space:]]'));
