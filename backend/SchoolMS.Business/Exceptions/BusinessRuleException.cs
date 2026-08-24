namespace SchoolMS.Business.Exceptions;

// Thrown when a request violates a business rule (e.g. invalid marks, past deadline). Maps to HTTP 400.
public class BusinessRuleException : Exception
{
    public BusinessRuleException(string message) : base(message)
    {
    }
}
