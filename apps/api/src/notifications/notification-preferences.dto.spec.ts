import { validate } from 'class-validator';
import { UpdateNotificationPreferencesDto } from './notification-preferences.dto';

describe('notification preference DTO validation', () => {
  it('accepts boolean preference updates', async () => {
    const dto = Object.assign(new UpdateNotificationPreferencesDto(), {
      emailAlerts: true,
      smsAlerts: false,
      attendanceWarnings: true,
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects string values instead of coercing them to booleans', async () => {
    const dto = Object.assign(new UpdateNotificationPreferencesDto(), {
      emailAlerts: 'false',
    });
    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'emailAlerts')).toBe(true);
  });
});
