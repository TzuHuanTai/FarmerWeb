import { Component, Input } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { RoleGroup } from '../../../../interface/system_auth/role_group';

@Component({
    selector: 'character-create-unit',
    templateUrl: 'chatacter-create.component.html',
    styleUrls: ['../character.component.css']
})

export class CharacterCreateComponent {
    // we will pass in address, named as group when Input, from MenuComponent
    @Input('group') public roleForm: UntypedFormGroup;
    @Input('roleList') public roleList: RoleGroup[];

    constructor() {}
}
