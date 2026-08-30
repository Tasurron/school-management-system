using Microsoft.EntityFrameworkCore;
using SchoolMS.Business.DTOs.Classes;
using SchoolMS.Business.Exceptions;
using SchoolMS.Business.Interfaces;
using SchoolMS.Data.Entities;
using SchoolMS.Data.Repositories.Interfaces;

namespace SchoolMS.Business.Services;

public class ClassService : IClassService
{
    private static readonly int[] AllowedGrades = { 8, 9, 10, 11, 12 };
    private static readonly string[] AllowedSections = { "A", "B" };

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
        var classes = await _classRepository.Query().OrderBy(c => c.Grade).ThenBy(c => c.Section).ToListAsync();
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
        var section = ValidateAndNormalize(request);

        var duplicate = await _classRepository.Query()
            .AnyAsync(c => c.Grade == request.Grade && c.Section == section);
        if (duplicate)
        {
            throw new ConflictException($"Class {request.Grade} - Section {section} already exists.");
        }

        var classEntity = new Class
        {
            Grade = request.Grade,
            Section = section,
            Name = BuildName(request.Grade, section)
        };
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

        var section = ValidateAndNormalize(request);

        var duplicate = await _classRepository.Query()
            .AnyAsync(c => c.Grade == request.Grade && c.Section == section && c.Id != id);
        if (duplicate)
        {
            throw new ConflictException($"Class {request.Grade} - Section {section} already exists.");
        }

        classEntity.Grade = request.Grade;
        classEntity.Section = section;
        classEntity.Name = BuildName(request.Grade, section);
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

    private static string ValidateAndNormalize(ClassRequest request)
    {
        if (!AllowedGrades.Contains(request.Grade))
        {
            throw new BusinessRuleException("Grade must be one of: 8, 9, 10, 11, 12.");
        }

        var section = request.Section.Trim().ToUpperInvariant();
        if (!AllowedSections.Contains(section))
        {
            throw new BusinessRuleException("Section must be one of: A, B.");
        }

        return section;
    }

    private static string BuildName(int grade, string section) => $"Class {grade} - Section {section}";

    private static ClassResponseDto MapToDto(Class classEntity) => new()
    {
        Id = classEntity.Id,
        Grade = classEntity.Grade,
        Section = classEntity.Section,
        Name = classEntity.Name
    };
}
