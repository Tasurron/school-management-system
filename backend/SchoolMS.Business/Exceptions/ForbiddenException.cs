namespace SchoolMS.Business.Exceptions;

// Thrown when the current user is not allowed to perform an action (role or ownership violation). Maps to HTTP 403.
public class ForbiddenException : Exception
{
    public ForbiddenException(string message) : base(message)
    {
    }
}
