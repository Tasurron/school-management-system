namespace SchoolMS.Business.Exceptions;

// Thrown when a request conflicts with existing data (e.g. duplicate email, duplicate submission). Maps to HTTP 409.
public class ConflictException : Exception
{
    public ConflictException(string message) : base(message)
    {
    }
}
