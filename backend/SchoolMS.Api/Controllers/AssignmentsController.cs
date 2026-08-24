using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolMS.Api.Extensions;
using SchoolMS.Business.DTOs.Assignments;
using SchoolMS.Business.Interfaces;

namespace SchoolMS.Api.Controllers;

[ApiController]
[Route("api/assignments")]
[Authorize(Roles = "Admin,Teacher,Student")]
public class AssignmentsController : ControllerBase
{
    private readonly IAssignmentService _assignmentService;

    public AssignmentsController(IAssignmentService assignmentService)
    {
        _assignmentService = assignmentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? classId,
        [FromQuery] int? subjectId,
        [FromQuery] int? teacherId)
    {
        var result = await _assignmentService.GetAllAsync(User.GetUserId(), User.GetRole(), classId, subjectId, teacherId);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _assignmentService.GetByIdAsync(id, User.GetUserId(), User.GetRole());
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> Create([FromBody] CreateAssignmentRequest request)
    {
        var result = await _assignmentService.CreateAsync(request, User.GetUserId());
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateAssignmentRequest request)
    {
        var result = await _assignmentService.UpdateAsync(id, request, User.GetUserId());
        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> Delete(int id)
    {
        await _assignmentService.DeleteAsync(id, User.GetUserId());
        return NoContent();
    }
}
