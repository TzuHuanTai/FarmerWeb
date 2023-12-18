import { Component, Input } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';

@Component({
    selector: 'action-create-unit',
    templateUrl: 'action-create.component.html',
    styleUrls: ['../../action.component.css'],
})

export class ActionCreateComponent {
    // we will pass in address, named as group when Input, from ActionComponent
    @Input('group') public actionForm: UntypedFormGroup;
    methodList: string[] = ['GET', 'POST', 'PUT', 'DELETE'];

    constructor() { }

    compareObjects(o1: any, o2: any): boolean {
        if (o1 === '') { o1 = 'GET'; }
        return o1 === o2;
    }
}
