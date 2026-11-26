-- Commit the enum value before any migration uses it in a constraint.
ALTER TYPE "RequestState" ADD VALUE 'WITHDRAWN';
