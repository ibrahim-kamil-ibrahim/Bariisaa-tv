-- Remove legacy seeded roles (superseded by admin/editor/moderator),
-- but only when no users are still assigned to them.
DELETE FROM role_permissions
WHERE "roleId" IN (
  SELECT r.id FROM roles r
  WHERE r.name IN ('content_manager', 'support_agent')
    AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur."roleId" = r.id)
);

DELETE FROM roles
WHERE name IN ('content_manager', 'support_agent')
  AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur."roleId" = roles.id);
