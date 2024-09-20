/*
    DO YOU WANT TO ANY TYPE OF FORMATE YOU CAN CREATE WITH USE OF BELOW TOKENS
    
    yyyy    : Year with four digits (e.g., 2022).
    MM      : Month with zero-padding (01 to 12).
    dd      : Day of the month with zero-padding (01 to 31).
    HH      : Hours in 24-hour format with zero-padding (00 to 23).
    mm      : Minutes with zero-padding (00 to 59).
    ss      : Seconds with zero-padding (00 to 59).
    S       : Milliseconds (0 to 999).
    E       : Day of the week, short version (e.g., Mon).
    EEEE    : Day of the week, full version (e.g., Monday).
    MMM     : Month, short version (e.g., Jan).
    MMMM    : Month, full version (e.g., January).
*/

import * as moment from 'moment-timezone';

export const _YYYYMMDD = 'YYYY-MM-DD';
export const _DDMMYYYY = 'DD-MM-YYYY';
export const _MMDDYYYY = 'MM-DD-YYYY';

export const YYYYMMDD = 'YYYY/MM/DD';
export const DDMMYYYY = 'DD/MM/YYYY';
export const MMDDYYYY = 'MM/DD/YYYY';

export const DATE_WITH_TIME = 'YYYY-MM-DD HH:mm:ss';
export const TIME_FORMAT = 'HH:mm:ss';
export const FULL_DATE_FORMAT = 'MMMM DD, YYYY';
export const SHORT_DATE_FORMAT = 'MMM DD, YYYY';

export const TIMEZONE_UTC = 'UTC'; //'Asia/Kolkata'; // Default UTC timezone
export const NEW_YORK_TIMEZONE = 'America/New_York';

export function format_date(
  dateFormat = DDMMYYYY,
  date: Date | string | number = new Date(),
  timezone = TIMEZONE_UTC,
) {
  return comman_date(date, timezone).format(dateFormat);
}

export function date_moment(
  date: Date | string | number = new Date(),
  timezone = TIMEZONE_UTC,
) {
  return comman_date(date, timezone).toDate();
}

export function add_days(
  date: Date | string | number,
  days,
  timezone = TIMEZONE_UTC,
) {
  return comman_date(date, timezone).add(days, 'days').toDate();
}

export function sub_days(
  date: Date | string | number,
  days,
  timezone = TIMEZONE_UTC,
) {
  return comman_date(date, timezone).subtract(days, 'days').toDate();
}

export function add_months(
  date: Date | string | number,
  months,
  timezone = TIMEZONE_UTC,
) {
  return comman_date(date, timezone).add(months, 'months').toDate();
}

export function sub_months(
  date: Date | string | number,
  months,
  timezone = TIMEZONE_UTC,
) {
  return comman_date(date, timezone).subtract(months, 'months').toDate();
}

export function add_years(
  date: Date | string | number,
  years,
  timezone = TIMEZONE_UTC,
) {
  return comman_date(date, timezone).add(years, 'years').toDate();
}

export function sub_years(
  date: Date | string | number,
  years,
  timezone = TIMEZONE_UTC,
) {
  return comman_date(date, timezone).subtract(years, 'years').toDate();
}

export function comman_date(date, timezone) {
  return moment(date).tz(timezone, true);
}

export function add_minutes(
  date: Date | string | number,
  minutes: number,
  timezone = TIMEZONE_UTC,
): Date {
  return comman_date(date, timezone).add(minutes, 'minutes').toDate();
}

export function addMinutesToTimestamp(
  timestamp: Date | string | number,
  minutes: number = 5,
): Date {
  return moment.utc(timestamp).add(minutes, 'minutes').toDate();
}

export function is_date_expire(date1: Date, date2: Date): boolean {
  return moment(date1).isAfter(date2);
}

export async function getNextDays(numberOfDays: number): Promise<string[]> {
  const today = new Date();
  return Array.from({ length: numberOfDays }, (_, i) => {
    const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
    return date.toLocaleDateString('default', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  });
}

export function comman_slot_date(date, timezone): Date {
  const parsedDate = new Date(date).toISOString();
  return moment(parsedDate).tz(timezone, true).toDate();
}

export function formatTimeIn12HourFormat(date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;

  return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}
