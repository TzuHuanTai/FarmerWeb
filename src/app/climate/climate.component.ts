import { Component, AfterContentInit, ViewChild, ElementRef, OnInit } from '@angular/core';
import { ClimateService } from '../../api/greenhouse/climate.service';
import { StationInfoService } from '../../api/greenhouse/station_into.service';
import { Climate, LineChartData } from '../../interface/greenhouse/climate';
import { StationInfo } from '../../interface/greenhouse/station_info';

/** If there isn't a declaration file, the TypeScript compiler
 * doesn't know if the module exists, so you need to use require
 * instead which lacks the compilation checking.*/
import Highcharts, { Options } from 'highcharts/highstock';
import { iif } from 'rxjs';
// import HighchartsMore from 'highcharts/highcharts-more';

/**https://www.highcharts.com/docs/getting-started/install-from-npm
 * 兩種方式都可載入，請看highcharts-more.js最上方的code
 * 其factory定義為返回module的function
 * if (typeof module === 'object' && module.exports) {
        module.exports = factory;
    } else {
        factory(Highcharts);
    }*/
// 1.
// HighchartsMore(Highcharts)
/** dirty and quick, set tsconfig.app.ts is better */
// declare var require: any;
// 2.
require('highcharts/highcharts-more')(Highcharts);

@Component({
  selector: 'app-climate',
  templateUrl: './climate.component.html',
  styleUrls: ['./climate.component.css'],
  providers: [ClimateService, StationInfoService]
})

export class ClimateComponent implements OnInit, AfterContentInit {

  stations: StationInfo[];
  searchNum: number = 1000;
  selectedStations: StationInfo = new StationInfo();
  humidityChart: Highcharts.Chart;
  temperatureChart: Highcharts.Chart;
  @ViewChild('humidityChart', { static: true }) humidityChartEle: ElementRef;
  @ViewChild('temperatureChart', { static: true }) temperatureChartEle: ElementRef;

  constructor(
    private climateService: ClimateService,
    private stationInfoService: StationInfoService,
  ) {
  }

  ngOnInit() {
    const timezoneOffset: number = new Date().getTimezoneOffset();
    // 設定Highstock屬性
    const optionsA: Options = {
      chart: {
        // type: 'spline'
        zoomType: 'x'
      },
      title: {
        text: 'Hourly temperatures'
      },
      rangeSelector: {
        buttons: [{
          type: 'day',
          count: 3,
          text: '3d'
        }, {
          type: 'week',
          count: 1,
          text: '1w'
        }, {
          type: 'month',
          count: 1,
          text: '1m'
        }, {
          type: 'month',
          count: 6,
          text: '6m'
        }, {
          type: 'year',
          count: 1,
          text: '1y'
        }, {
          type: 'all',
          text: 'All'
        }],
        selected: 2
      },
      xAxis: {
        type: 'datetime', // 'categories'/*: ['Apples', 'Bananas', 'Oranges']*/
        dateTimeLabelFormats: { // don't display the dummy year
          day: '%b. %e',
          week: '%b. %e',
          month: '%b. %e',
          year: '%Y',
        },
        title: {
          text: 'Date'
        }
      },
      yAxis: {
        title: {
          text: 'Temperature(°C)'
        }
      },
      time: {
        timezoneOffset: timezoneOffset,
      },
      tooltip: {
        headerFormat: '<b>{point.x: %b.%e, %H:%M}</b><br>',
        pointFormat: '<b>{series.name}: {point.y:.2f}°C</b>'
      },
      series: [{
        type: 'line',
        name: 'Temperature',
        data: []
      }],
      credits: { enabled: false }
    };

    const optionsB: Options = {
      chart: {
        // type: 'spline'
        zoomType: 'x'
      },
      title: {
        text: 'Hourly Humidity'
      },
      rangeSelector: {
        buttons: [{
          type: 'day',
          count: 3,
          text: '3d'
        }, {
          type: 'week',
          count: 1,
          text: '1w'
        }, {
          type: 'month',
          count: 1,
          text: '1m'
        }, {
          type: 'month',
          count: 6,
          text: '6m'
        }, {
          type: 'year',
          count: 1,
          text: '1y'
        }, {
          type: 'all',
          text: 'All'
        }],
        selected: 2
      },
      xAxis: {
        type: 'datetime', // 'categories'/*: ['Apples', 'Bananas', 'Oranges']*/
        dateTimeLabelFormats: { // don't display the dummy year
          day: '%b. %e',
          week: '%b. %e',
          month: '%b. %e',
          year: '%Y',
        },
        title: {
          text: 'Date'
        }
      },
      yAxis: {
        title: {
          text: 'Relative Humidity(%)'
        }
      },
      time: {
        timezoneOffset: timezoneOffset,
      },
      tooltip: {
        headerFormat: '<b>{point.x: %b.%e, %H:%M}</b><br>',
        pointFormat: '<b>{series.name}: {point.y:.2f}%</b>'
      },
      series: [{
        type: 'spline',
        name: 'RH',
        data: []
      }],
      credits: { enabled: false }
    };

    // 初始化Highstock
    this.temperatureChart = Highcharts.stockChart(this.temperatureChartEle.nativeElement, optionsA);
    this.humidityChart = Highcharts.stockChart(this.humidityChartEle.nativeElement, optionsB);
  }

  ngAfterContentInit() {
    this.stationInfoService.getStationInfo().subscribe((result: StationInfo[]) => {
      this.stations = result;
      // Default greenhouse own
      this.selectedStations = this.stations.find(x => x.stationId === 0);
      this.drawDataOnHighchart(this.selectedStations.stationId, this.searchNum);
    }, (error) => {
      console.error(error);
    });
  }

  onSelect(stationId: string | number) {
    this.stations.forEach(value => {
      if (value.stationId === Number(stationId)) {
        this.selectedStations = value;
      }
    });

    this.drawDataOnHighchart(Number(stationId), this.searchNum);
  }

  private drawDataOnHighchart(stationId: number, searchNum: number) {
    iif(
      () => !stationId || stationId === 0,
      this.climateService.getGreenhouseClimate(searchNum),
      this.climateService.getCwbClimate(stationId, searchNum),
    ).subscribe((response: Climate[]) => {
      this.drawLineHighcharts(
        this.temperatureChart,
        response.map(x => new LineChartData({ obsTime: x.obsTime, data: x.temperature }))
      );

      this.drawLineHighcharts(
        this.humidityChart,
        response.map(x => new LineChartData({ obsTime: x.obsTime, data: x.rh }))
      );
    }, (error) => {
      console.error(error);
    });
  }

  private drawLineHighcharts(chart: Highcharts.Chart, updateData: LineChartData[]) {
    const insertData: any[][] = updateData.map(v => [new Date(v.obsTime).getTime(), v.data]);
    chart.series[0].update({ type: 'spline', data: insertData }, true);
  }
}
