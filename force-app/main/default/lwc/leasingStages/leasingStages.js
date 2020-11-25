import { LightningElement, api } from 'lwc';

const stages = {};

export default class LeasingStages extends LightningElement {
    stages = stages;
    @api flowStages;
    @api currentStage;
}
