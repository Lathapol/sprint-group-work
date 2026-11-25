-- Add the value in a separate migration so it commits before constraints use it.
ALTER TYPE "RequestState" ADD VALUE 'RETURNED';
