using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolMS.Api.Extensions;
using SchoolMS.Business.DTOs.TeacherAssignments;
using SchoolMS.Business.Interfaces;

namespace SchoolMS.Api.Controllers;

[ApiController]
[Route("api/teacher-assignments")]
[Authorize(Roles = "Admin,Teacher")]
public class TeacherAssignmentsController : ControllerBase
{
    private readonly ITeacherAssignmentService _teacherAssignmentService;

    public TeacherAssignmentsController(ITeacherAssignmentService teacherAssignmentService)
    {
        _teacherAssignmentService = teacherAssignmentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? teacherId)
    {
        var result = await _teacherAssignmentService.GetAllAsync(User.GetUserId(), User.GetRole(), teacherId);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _teacherAssignmentService.GetByIdAsync(id, User.GetUserId(), User.GetRole());
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateTeacherAssignmentRequest request)
    {
        var result = await _teacherAssignmentService.CreateAsync(request, User.GetUserId());
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await _teacherAssignmentService.DeleteAsync(id, User.GetUserId());
        return NoContent();
    }
}
