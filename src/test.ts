import {Component} from "./Core";

export class Test extends Component<{x: number, y: number, z: number}> {}
export class Test2 extends Component<boolean> {}

export type ComponentCtor<T> = {new (...args: any[]): Component<T>};
export function addComponent<T extends ComponentCtor<any>>(component: T, value: T extends ComponentCtor<infer U> ? U : any) {}
export function getComponent<T extends ComponentCtor<any>>(component: T): T extends ComponentCtor<infer U> ? U : any {
    return undefined as any;
}

addComponent(Test2, true);
getComponent(Test);

// export class Archetype
