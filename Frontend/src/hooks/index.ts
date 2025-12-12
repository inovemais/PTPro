enum TypeOperation {
    sum = 'sum',
    multiply = 'multiply'
}

interface House {
    number: string;
}

interface operation{
    number: number;
    type: TypeOperation;
}

function sum(a: operation, b: string) {

}

sum({ number: 23, type: TypeOperation.multiply }, '23');

const b : House[] = [{
    number: '23'
}]


