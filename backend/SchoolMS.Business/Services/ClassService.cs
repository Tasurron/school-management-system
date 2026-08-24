using Microsoft.EntityFrameworkCore;
using SchoolMS.Business.DTOs.Classes;
using SchoolMS.Business.Exceptions;
using SchoolMS.Business.Interfaces;
using SchoolMS.Data.Entities;
using SchoolMS.Data.Repositories.Interfaces;

namespace SchoolMS.Business.Services;

public class ClassService : IClassService
{
    private readonly IClassRepository _classRepository;
    private readonly IUserRepository _userRepository;
    private readonly IAssignmentRepository _assignmentRepository;

    public ClassService(
        IClassRepository classRepository,
        IUserRepository userRepository,
        IAssignmentRepository assignmentRepository)
    {
        _classRepository = classRepository;
        _userRepository = userRepository;
        _assignmentRepository = assignmentRepository;
    }

    public async Task<List<ClassResponseDto>> GetAllAsync()
    {
        var classes = await _classRepository.Query().OrderBy(c => c.Id).ToListAsync();
        return classes.Select(MapToDto).ToList();
    }

    public async Task<ClassResponseDto> GetByIdAsync(int id)
    {
        var classEntity = await _classRepository.GetByIdAsync(id);
        if (classEntity == null)
        {
            throw new NotFoundException($"Class with id {id} was not found.");
        }

        return MapToDto(classEntity);
    }

    public async Task<ClassResponseDto> CreateAsync(ClassRequest request)
    {
        var duplicate = await _classRepository.Query().AnyAsync(c => c.Name == request.Name);
        if (duplicate)
        {
            throw new ConflictException($"A class named '{request.Name}' already exists.");
        }

        var classEntity = new Class { Name = request.Name };
        await _classRepository.AddAsync(classEntity);
        await _classRepository.SaveChangesAsync();

        return MapToDto(classEntity);
    }

    public async Task<ClassResponseDto> UpdateAsync(int id, ClassRequest request)
    {
        var classEntity = await _classRepository.GetByIdAsync(id);
        if (classEntity == null)
        {
            throw new NotFoundException($"Class with id {id} was not found.");
        }

        var duplicate = await _classRepository.Query().AnyAsync(c => c.Name == request.Name && c.Id != id);
        if (duplicate)
        {
            throw new ConflictException($"A class named '{request.Name}' already exists.");
        }

        classEntity.Name = request.Name;
        _classRepository.Update(classEntity);
        await _classRepository.SaveChangesAsync();

        return MapToDto(classEntity);
    }

    public async Task DeleteAsync(int id)
    {
        var classEntity = await _classRepository.GetByIdAsync(id);
        if (classEntity == null)
        {
            throw new NotFoundException($"Class with id {id} was not found.");
        }

        var referencedByUser = await _userRepository.Query().AnyAsync(u => u.ClassId == id);
        var referencedByAssignment = await _assignmentRepository.Query().AnyAsync(a => a.ClassId == id);
        if (referencedByUser || referencedByAssignment)
        {
            throw new ConflictException("This class cannot be deleted because it is referenced by existing users or assignments.");
        }

        _classRepository.Delete(classEntity);
        await _classRepository.SaveChangesAsync();
    }

    private static ClassResponseDto MapToDto(Class classEntity) => new()
    {
        Id = classEntity.Id,
        Name = classEntity.Name
    };
}
