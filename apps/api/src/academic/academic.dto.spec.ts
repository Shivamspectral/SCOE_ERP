import { validate } from 'class-validator';
import { CreateAcademicSubjectDto, CreateTimetableEntryDto } from './academic.dto';

describe('academic DTO validation', () => {
  const validDepartmentId = '8e1f8c3d-7e6c-4a2a-9d4c-1b6d1b8a2f31';

  it('accepts fractional credit values used by academic curricula', async () => {
    const dto = Object.assign(new CreateAcademicSubjectDto(), {
      departmentId: validDepartmentId,
      name: 'Engineering Mathematics',
      credits: 4.5,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects credit values with unsupported precision', async () => {
    const dto = Object.assign(new CreateAcademicSubjectDto(), {
      departmentId: validDepartmentId,
      name: 'Engineering Mathematics',
      credits: 4.55,
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'credits')).toBe(true);
  });

  it('rejects timetable times outside the 24-hour clock', async () => {
    const dto = Object.assign(new CreateTimetableEntryDto(), {
      departmentId: validDepartmentId,
      subject: 'Data Structures',
      cohort: 'SE-CE-A',
      dayOfWeek: 2,
      startsAt: '25:10',
      endsAt: '26:00',
    });

    const errors = await validate(dto);
    expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining(['startsAt', 'endsAt']));
  });

  it('accepts valid 24-hour timetable times', async () => {
    const dto = Object.assign(new CreateTimetableEntryDto(), {
      departmentId: validDepartmentId,
      subject: 'Data Structures',
      cohort: 'SE-CE-A',
      dayOfWeek: 2,
      startsAt: '09:10',
      endsAt: '10:00',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
