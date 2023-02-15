require('dotenv').config();
const moment = require('moment-timezone');
const express = require("express");
const app = express();

// Gregorian to jalali convertor
const div = (a, b) => {
  return parseInt((a / b));
}
const gregorianToJalali = (g_y, g_m, g_d) => {
  var g_days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var j_days_in_month = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  var jalali = [];
  var gy = g_y - 1600;
  var gm = g_m - 1;
  var gd = g_d - 1;

  var g_day_no = 365 * gy + div(gy + 3, 4) - div(gy + 99, 100) + div(gy + 399, 400);

  for (var i = 0; i < gm; ++i)
    g_day_no += g_days_in_month[i];
  if (gm > 1 && ((gy % 4 == 0 && gy % 100 != 0) || (gy % 400 == 0)))
    /* leap and after Feb */
    g_day_no++;
  g_day_no += gd;

  var j_day_no = g_day_no - 79;

  var j_np = div(j_day_no, 12053);
  /* 12053 = 365*33 + 32/4 */
  j_day_no = j_day_no % 12053;

  var jy = 979 + 33 * j_np + 4 * div(j_day_no, 1461);
  /* 1461 = 365*4 + 4/4 */

  j_day_no %= 1461;

  if (j_day_no >= 366) {
    jy += div(j_day_no - 1, 365);
    j_day_no = (j_day_no - 1) % 365;
  }
  for (var i = 0; i < 11 && j_day_no >= j_days_in_month[i]; ++i)
    j_day_no -= j_days_in_month[i];
  var jm = i + 1;
  var jd = j_day_no + 1;
  jalali[0] = jy;
  jalali[1] = jm;
  jalali[2] = jd;
  return jalali;
}

// translate weeks to persian
const getFarsiWeek = (data) => {
  switch (data) {
    case 6:
      return "شنبه";
    case 0:
      return "یکشنبه";
    case 1:
      return "دوشنبه";
    case 2:
      return "سه شنبه";
    case 3:
      return "چهارشنبه";
    case 4:
      return "پنجشنبه";
    case 5:
      return "جمعه";
  }
}

// convert weeks number to jalai
const ConvertWeek = (data) => {
  switch (data) {
    case 6:
      return 0;
    case 0:
      return 1;
    case 1:
      return 2;
    case 2:
      return 3;
    case 3:
      return 4;
    case 4:
      return 5;
    case 5:
      return 6;
  }
}

// translate month to persian
const getFarsiMonth = (month) => {
  switch (month) {
    case 1:
      return "فروردین";
      break;
    case 2:
      return "اردیبهشت";
      break;
    case 3:
      return "خرداد";
      break;
    case 4:
      return "تیر";
      break;
    case 5:
      return "مرداد";
      break;
    case 6:
      return "شهریور";
      break;
    case 7:
      return "مهر";
      break;
    case 8:
      return "آبان";
      break;
    case 9:
      return "آذر";
      break;
    case 10:
      return "دی";
      break;
    case 11:
      return "بهمن";
      break;
    case 12:
      return "اسفند";
      break;
  }
}

// sort year, month, day from api
const getYearMonthDay = (date) => {
  let convertDate;
  let y = date.substr(0, 4);
  let m = date.substr(5, 2);
  let d = date.substr(8, 2);
  convertDate = gregorianToJalali(y, m, d);
  return convertDate;
}

// check zero before time
const checkTimeZero = (i) => {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}

// convert system time zone for asia,tehran
const getDate = (date, a, c, r) => {
  const J_date = getYearMonthDay(date.format('YYYY:MM:DD'));
  let output = {
    "timezone": `${!r ? `${!c ? `${a}` : `${a}/${c}`}` : `${a}/${c}/${r}`}`,

    "time": {
      "full": `${date.format('HH')}:${date.format('mm')}:${date.format('ss')}`,
      "hour": parseInt(date.format('H')),
      "minute": parseInt(date.format('m')),
      "secend": parseInt(date.format('s'))
    },

    // Gregorian Calendar
    "gregorian": {
      "date": date.format(),
      "fulldate": date.format('dddd, D MMMM Y'),
      "day": date.date(),
      "weekday": {
        "number": date.day(),
        "name": date.format('dddd'),
        "format": "0-6"
      },
      "month": {
        "number": parseInt(date.format('M')) - 1,
        "name": date.format('MMMM'),
        "format": "0-11"
      },
      "year": date.year()
    },

    // Jajali Calendar
    "jalali": {
      "date": `${checkTimeZero(J_date[0])}-${checkTimeZero(J_date[1])}-${checkTimeZero(J_date[2])}T${date.format('HH')}:${date.format('mm')}:${date.format('ss')}${date.format('Z')}`,
      "fulldate": `${getFarsiWeek(parseInt(date.day()))}، ${J_date[2]} ${getFarsiMonth(J_date[1])} ${checkTimeZero(J_date[0])}`,
      "day": J_date[2],
      "weekday": {
        "number": ConvertWeek(date.day()),
        "name": `${getFarsiWeek(parseInt(date.day()))}`,
        "format": "0-6"
      },
      "month": {
        "number": J_date[1] - 1,
        "name": `${getFarsiMonth(J_date[1])}`,
        "format": "0-11"
      },
      "year": J_date[0]
    }
  };
  return output;
}

// send inputs to getDate
const convertTZ = (a, c, r) => {
  if (!r) {
    if (!c) {
      const date = moment().tz(a);
      return getDate(date, a);
    } else {
      const date = moment().tz(`${a}/${c}`);
      return getDate(date, a, c);
    }
  } else {
    const date = moment().tz(`${a}/${c}/${r}`);
    return getDate(date, a, c, r);
  }
}

// Get all time zone
const all_Zone = moment.tz.names();

// Add headers
app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();

});

// URL's
app.get('/timezone', (req, res, next) => {

  const API_KEY = req.header('API_KEY');

  if (!API_KEY) {
    return res.status(403).json(
      {
        "code": '403',
        "status": 'Forbidden',
        "data": 'API Key is not found'
      }
    );
  }
  if (API_KEY !== process.env.API_KEY) {
    return res.status(403).json(
      {
        "code": '403',
        "status": 'Forbidden',
        "data":'API Key is invalid'
      }
    );
  }

  const Area = req.query.area;
  const City = req.query.city;
  const Region = req.query.region;

  if (all_Zone.includes(`${Area}/${City}/${Region}`)) {
    res.json(
      {
        "code": '200',
        "status": 'OK',
        "data": convertTZ(Area, City, Region)
      }
    );
  } else if (all_Zone.includes(`${Area}/${City}`)){
    res.json(
      {
        "code": '200',
        "status": 'OK',
        "data": convertTZ(Area, City)
      }
    );
  } else if (all_Zone.includes(`${Area}`)){
    res.json(
      {
        "code": '200',
        "status": 'OK',
        "data": convertTZ(Area)
      }
    );
  }
  else {
    return res.status(400).json(
      {
        'code': '400',
        'status': 'Bad Request',
        'data': 'Invalid area or city or region or unable to convert it'
      }
    );
  }

});

// Ports
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));