using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolMS.Api.Extensions;
using SchoolMS.Business.DTOs.Submissions;
using SchoolMS.Business.Interfaces;

namespace SchoolMS.Api.Controllers;

[ApiController]
[Route("api/submissions")]
[Authorize(Roles = "Admin,Teacher,Student")]
public class SubmissionsController : ControllerBase
{
    private readonly ISubmissionService _submissionService;

    public SubmissionsController(ISubmissionService submissionService)
    {
        _submissionService = submissionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? assignmentId, [FromQuery] int? studentId)
    {
        var result = await _submissionService.GetAllAsync(User.GetUserId(), User.GetRole(), assignmentId, studentId);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _submissionService.GetByIdAsync(id, User.GetUserId(), User.GetRole());
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> Create([FromBody] CreateSubmissionRequest request)
    {
        var result = await _submissionService.CreateAsync(request, User.GetUserId());
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateSubmissionRequest request)
    {
        var result = await _submissionService.UpdateAsync(id, request, User.GetUserId());
        return Ok(result);
    }

    [HttpPut("{id:int}/grade")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> Grade(int id, [FromBody] GradeSubmissionRequest request)
    {
        var result = await _submissionService.GradeAsync(id, request, User.GetUserId());
        return Ok(result);
    }
}
