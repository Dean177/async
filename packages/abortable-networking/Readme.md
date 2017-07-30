# abortable-networking
 
Provides an [abortable](https://www.npmjs.com/package/abortable) implementation for [superagent](https://github.com/visionmedia/superagent).
Optimised for working with JSON & typescript, but all of the functions provided work with the superagent request object, so any of the functionality in super agent can still be used.


## Installation

`yarn add abortable-networking`

or if you prefer npm

`npm install abortable-networking --save`

## Usage

``` typescript
import { AbortableRequest, fetchJson, from } from 'abortable-networking

const fromZoo = from('https://zoo.example.com');

type CutestResponse = { animal: string };
const fetchCutestAnimal = (): AbortableRequest<CutestResponse> =>
  fetchJson(fromZoo('/cutest-animal'))
  
type NewAnimalRequest = { name: string, cutenessRating: number };
type NewAnimalResponse = { id: number };
const addNewAnimal = (animal: NewAnimalRequest): AbortableRequest<AnimalResponse> =>
  fetchJson(
    withJsonBody(animal)(
      fromZoo('/animals', 'post')));