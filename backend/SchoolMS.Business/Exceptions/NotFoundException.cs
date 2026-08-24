namespace SchoolMS.Business.Exceptions;

// Thrown when a requested resource does not exist. Maps to HTTP 404.
public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message)
    {
    }
}
