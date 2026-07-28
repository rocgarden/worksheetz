// /libs/admin/passageBank/resolveAuditActors.js
//
// Resolves passage-bank audit event actor UUIDs into readable
// admin identity fields using the Supabase service-role client.

/**
 * @param {unknown} value
 * @returns {string|null}
 */
function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
}

/**
 * @param {object|null|undefined} user
 * @returns {string|null}
 */
function getDisplayName(user) {
  const metadata =
    user?.user_metadata &&
    typeof user.user_metadata === "object"
      ? user.user_metadata
      : {};

  return (
    normalizeOptionalString(
      metadata.full_name,
    ) ||
    normalizeOptionalString(
      metadata.name,
    ) ||
    normalizeOptionalString(
      metadata.display_name,
    ) ||
    null
  );
}

/**
 * Adds readable actor information to passage-bank audit events.
 *
 * The original performed_by UUID is preserved.
 *
 * @param {object} options
 * @param {object} options.serviceSupabase Supabase service-role client
 * @param {Array<object>} options.events Audit event rows
 * @returns {Promise<Array<object>>}
 */
export async function resolvePassageBankAuditActors({
  serviceSupabase,
  events,
}) {
  const reviewEvents =
    Array.isArray(events)
      ? events
      : [];

  if (
    reviewEvents.length === 0
  ) {
    return [];
  }

  const actorIds = [
    ...new Set(
      reviewEvents
        .map((event) =>
          normalizeOptionalString(
            event?.performed_by,
          ),
        )
        .filter(Boolean),
    ),
  ];

  if (
    actorIds.length === 0
  ) {
    return reviewEvents;
  }

  const actorMap = new Map();

  await Promise.all(
    actorIds.map(async (actorId) => {
      try {
        const {
          data,
          error,
        } =
          await serviceSupabase.auth.admin.getUserById(
            actorId,
          );

        if (
          error ||
          !data?.user
        ) {
          console.warn(
            "[passage-bank] Could not resolve audit actor",
            {
              actor_user_id:
                actorId,

              error:
                error?.message ||
                "User was not returned.",
            },
          );

          return;
        }

        actorMap.set(
          actorId,
          {
            performed_by_email:
              normalizeOptionalString(
                data.user.email,
              ),

            performed_by_name:
              getDisplayName(
                data.user,
              ),
          },
        );
      } catch (error) {
        console.warn(
          "[passage-bank] Unexpected audit actor lookup failure",
          {
            actor_user_id:
              actorId,

            error:
              error instanceof Error
                ? error.message
                : String(error),
          },
        );
      }
    }),
  );

  return reviewEvents.map(
    (event) => {
      const actor =
        actorMap.get(
          event?.performed_by,
        ) || {};
console.log("actor:: ", actor)
      return {
        ...event,

        performed_by_email:
          actor.performed_by_email ||
          null,

        performed_by_name:
          actor.performed_by_name ||
          null,
      };
    },
  );
}