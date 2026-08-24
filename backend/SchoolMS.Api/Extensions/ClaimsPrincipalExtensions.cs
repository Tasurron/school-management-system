using System.Security.Claims;

namespace SchoolMS.Api.Extensions;

// Small helpers for pulling the current user's id and role out of the JWT claims,
// so controllers don't repeat this logic everywhere.
public static class ClaimsPrincipalExtensions
{
    public static int GetUserId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.Parse(value ?? throw new InvalidOperationException("Missing user id claim."));
    }

    public static string GetRole(this ClaimsPrincipal user)
    {
        return user.FindFirstValue(ClaimTypes.Role) ?? throw new InvalidOperationException("Missing role claim.");
    }
}
