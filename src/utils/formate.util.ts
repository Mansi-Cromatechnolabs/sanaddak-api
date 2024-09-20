import { I18nContext } from 'nestjs-i18n';
import * as moment from 'moment-timezone';

export async function formatCurrency(
  value: number,
  i18n: I18nContext,
): Promise<string> {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: i18n.t(`lang.gold_loan.egp`),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(value);
}

export async function ConvertTimeStringToMinutes(
  time: string,
): Promise<Number> {
  const momentTime = moment(time, 'hh:mm A');
  return momentTime.hour() * 60 + momentTime.minute();
}

export function getStartAndEndTime(date) {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  const startTime = `${startDate.getFullYear()}-${padZero(startDate.getMonth() + 1)}-${padZero(startDate.getDate())}T${padZero(startDate.getHours())}:${padZero(startDate.getMinutes())}:${padZero(startDate.getSeconds())}.${padZero(startDate.getMilliseconds(), 3)}+00:00`;
  const endTime = `${endDate.getFullYear()}-${padZero(endDate.getMonth() + 1)}-${padZero(endDate.getDate())}T${padZero(endDate.getHours())}:${padZero(endDate.getMinutes())}:${padZero(endDate.getSeconds())}.${padZero(endDate.getMilliseconds(), 3)}+00:00`;

  return { startTime, endTime };
}
function padZero(value, length = 2) {
  return (value < 10 ** (length - 1) ? '0'.repeat(length - value.toString().length) : '') + value;
}
