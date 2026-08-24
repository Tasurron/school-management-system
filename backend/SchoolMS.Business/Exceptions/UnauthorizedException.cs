namespace SchoolMS.Business.Exceptions;

// Thrown for authentication failures (bad credentials, inactive user). Maps to HTTP 401.
public class UnauthorizedException : Exception
{
    public UnauthorizedException(string message) : base(message)
    {
    }
}
