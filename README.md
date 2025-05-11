# Description

The Motorway backend take home code test. Please read the description and the brief carefully before starting the test.

**There's no time limit so please take as long as you wish to complete the test, and to add/refactor as much as you think is needed to solve the brief. However, we recommend around 60 - 120 minutes as a general guide, if you run out of time, then don't worry.**

**For anything that you did not get time to implement _or_ that you would like to change/add but you didn't feel was part of the brief, please feel free to make a note of it at the bottom of this README.md file**

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development (local)
$ npm run dev

# production mode (deployed)
$ npm run start
```

## Test

```bash
# run all tests
$ npm run test

# test coverage
$ npm run test:coverage
```

## Current Solution

This API is a simple but important API for motorway that is responsible for retrieving valuations for cars from a 3rd party (SuperCar Valuations) by the VRM (Vehicle Registration Mark) and mileage.

- The API has two routes
	- A PUT (/valuations/{vrm}) request to create a valuation for a vehicle which accepts a small amount of input data and performs some simple validation logic.
	- A GET (/valuations/{vrm}) request to get an existing valuation. Returns 404 if no valuation for the vrm exists.

- The PUT operation handles calling a third-party API to perform the actual valuation, there is some rudimentary mapping logic between Motorway & 3rd party requests/responses.
- The PUT request is not truly idempotent so the 3rd party is called each time this operation is called and the code catches duplicate key exceptions when writing to the database.
- If the 3rd party is unreachable or returns a 5xx error, the service returns a 500 Internal Server Error.
- The outcome is stored in a database for future retrieval in the GET request.
- All the logic for the entire operation is within a single method in a single "service" class.
- A QA engineer has added some high-level tests.
- The tests for validation failures all pass.
- A simple happy path test is currently failing as the I/O calls for the database and 3rd party have not been isolated and the clients are trying to hit real resources with an invalid configuration.

## Task Brief

As this is such an important service to Motorway, a decision has been made to add a fallback 3rd party provider called Premium Car Valuations in case SuperCar Valuations is unavailable for a period of time. Before we add any more features, we need to fix the broken test.

Here are a full list of tasks that need to be completed:

**Tests**

- Modify the code/test so that the existing test suite passes and no I/O calls are made during the execution of the test suite.

- Add a test for the GET call.

- All new functionality should have test coverage in a new or updated existing test.

**Features**

- Introduce a basic failover mechanism to call the fallback 3rd party provider (Premium Car Valuations) in the event that the failure rate of the calls to SuperCar Valuations exceeds 50%. To keep the test simple, assume this service is running as a single instance. Feel free to discuss how you might solve it differently if the service was to execute in a multi-node cluster. Be mindful that this is a popular API, therefore the solution needs to be able to handle tracking the success rate of a large number of requests.

- As Premium Car Valuations is more expensive to use, there is a need to revert back to SuperCar Valuations after a configurable amount of time. At this point, the failure rate to indicate failover should be reset.

- If both providers are unreachable or return a 5xx error, then the service should now return a 503 Service Unavailable Error.

- To save costs by avoiding calling either 3rd party, improve the PUT operation so that the providers are not called if a valuation has already occurred. NOTE: This is to save costs, not for any consistency concerns between Motorway and the 3rd party. (Don't worry about concurrency, if two requests for the same route occur at the same time, either response can be saved).

- To help increase customer confidence regarding the valuation Motorway shows the user, there is a new requirement to show the name of the provider who provided the valuation to the user on the front end, e.g. "Valued by Trusted Company {X}", therefore the name of the provider that was used for the valuation needs to be persisted in the database and returned in the response.

- The service should be tolerant to older records where there is no detail of the provider (Backwards Compatible).

- Refactor the code as you see fit to ensure it is more readable, maintainable and extensible.

- To help with auditing service level agreements with the providers over an indefinite time period, there is a need to store the following details of the request:

    - Request date and time
    - Request duration
    - Request url
    - Response code
    - Error code/message if applicable and the
    - Name of the provider

    The details must be stored in a ProviderLogs table, which is correlated to a VRM, there could potentially be more than one log per VRM.


## 3rd Party APIs

For the purposes of this code test, simple mocks have been created use a service called [Mocky](https://designer.mocky.io/) with simple canned responses. Assume, that these would be real RESTful/SOAP services.

## 3rd Party OpenAPI Specs

Details of the existing 3rd party (SuperCar Valuations) and the new provider (Premium Car Valuations) can be found below.

To view the OpenAPI specifications for the 3rd Party APIs at the links below, first run the `npm run third-party-api:serve-docs` command.

### SuperCar Valuations

This is the current and preferred provider used for valuations, it is a fairly modern and cost-effective API.

The OpenAPI Specification can be found [here](http://localhost:3001/docs).

The URI for this test stub in Mocky is https://run.mocky.io/v3/9245229e-5c57-44e1-964b-36c7fb29168b.

### Premium Car Valuations

This is the proposed fallback provider to be used for valuations, it is an old service and costs significantly more for each call.

The OpenAPI Specification can be found [here](http://localhost:3002/docs).

The URI for this test stub in Mocky is https://run.mocky.io/v3/0dfda26a-3a5a-43e5-b68c-51f148eda473.


# Candidate Notes
Here is a place for you to put any notes regarding the changes you made and the reasoning and what further changes you wish to suggest.

**Tests**

- Modify the code/test so that the existing test suite passes and no I/O calls are made during the execution of the test suite.\
**In the PUT method we're making calls to the getValuation method, and we're also interacting with the repository (findOneBy and insert operations). These interactions needed to be mocked as this is a unit test, and we're only supposed to test our code and not interactions with dependencies.**\
**For a production environment we should consider adding other types of tests like integration tests, canary tests and load tests which would involve testing the dependencies.**

- Add a test for the GET call.\
**I have added one test which covers the "happy path" but we should be adding more tests to cover all the different branches and statements.**

- All new functionality should have test coverage in a new or updated existing test.\
**I have added more unit tests which I'm detailing below.**\
**Test coverage is around 70-80% which is a bit low, so we should aim for covering more of our code.**

**Features**

- Introduce a basic failover mechanism to call the fallback 3rd party provider (Premium Car Valuations) in the event that the failure rate of the calls to SuperCar Valuations exceeds 50%. To keep the test simple, assume this service is running as a single instance. Feel free to discuss how you might solve it differently if the service was to execute in a multi-node cluster. Be mindful that this is a popular API, therefore the solution needs to be able to handle tracking the success rate of a large number of requests.\
**In order to introduce a fallback to the Premium Car Valuations provider I first had to implement this provider.**\
**Note: I had an issue with my personal computer and I had to use my work computer to complete the project. The run.mocky.io domain was blocked on that computer by the security tools installed, so I had to use mocks to test my implementation. I'm mentioning this because I've seen that the PremiumCar provider returns an XML response and I might have needed to tweak the Axios call to handle it gracefully, but I haven't been able to test it.**\
**In order to make things easily extensible and adaptable I have introduced a ValuationProvider interface which contains for now only one method signature: getValuation.**\
**All the valuations providers have to implement this interface.**\
**This allows us to use a dependency injection mechanism and to decouple services between each other.**\
**In order to implement the fallback mechanism I have chosen to introduce a circuit breaker as the requirements match the purpose of a circuit breaker.**\
**I could have chosen to use an off the shelf circuit breaker but for the purpose of this exercise I have chosen to implement a simple circuit break myself which allows to write unit tests for it.**\
**Using interfaces and dependency injection allow to easily switch providers. We're today using SuperCarProvider as a primary provider and PremiumCarProvider as a fallback provider, but if tomorrow we want to use a new provider we just need to implement it and instantiate it as part of the circuit breaker's instantiation, and it'll be working seamlessly.**\
**This complies with SOLID principles, especially with the Single Responsibility, Open/Closed and Dependency Inversion principles.**\
**If the service was to execute in a multi-node cluster this solution wouldn't be suitable as each instance of the circuit breaker would have their own counter for the number of requests.**\
**We should then move the counter to a distributed infrastructure like Redis or a metrics-based solution using for example Prometheus/Grafana.**\
**We don't want the circuit breaker to be a bottleneck, so we should make sure that the performances are top-notch.**

- As Premium Car Valuations is more expensive to use, there is a need to revert back to SuperCar Valuations after a configurable amount of time. At this point, the failure rate to indicate failover should be reset.\
**I have chosen 5 minutes as I think in a real scenario it should give enough time to the primary provider to recover.**\
**All the circuit breaker's parameters are hard-coded within that class, for a production environment we should consider moving these parameters to a distributed configuration management tool which would allow to change dynamically the parameters' values without having to restart the instances.**

- If both providers are unreachable or return a 5xx error, then the service should now return a 503 Service Unavailable Error.\
**I have created a custom ServiceUnavailableError which returns a 503 error.**

- To save costs by avoiding calling either 3rd party, improve the PUT operation so that the providers are not called if a valuation has already occurred. NOTE: This is to save costs, not for any consistency concerns between Motorway and the 3rd party. (Don't worry about concurrency, if two requests for the same route occur at the same time, either response can be saved).\
**In order to achieve that, I'm first checking if the valuation is in the DB, if yes we return the valuation from the DB, if not we call the valuation provider.**\
**I have written 2 unit tests which cover these 2 scenarios.**

- To help increase customer confidence regarding the valuation Motorway shows the user, there is a new requirement to show the name of the provider who provided the valuation to the user on the front end, e.g. "Valued by Trusted Company {X}", therefore the name of the provider that was used for the valuation needs to be persisted in the database and returned in the response.\
**I have added a "provider" attribute to the VehicleValuation entity.**

- The service should be tolerant to older records where there is no detail of the provider (Backwards Compatible).\
**I have made this new "provider" attribute nullable to indicate that the value can be null.**

- Refactor the code as you see fit to ensure it is more readable, maintainable and extensible.\
**I have previously mentioned changes I've made for making the code more extensible and adaptable.**

- To help with auditing service level agreements with the providers over an indefinite time period, there is a need to store the following details of the request:

    - Request date and time
    - Request duration
    - Request url
    - Response code
    - Error code/message if applicable and the
    - Name of the provider

  The details must be stored in a ProviderLogs table, which is correlated to a VRM, there could potentially be more than one log per VRM.\
**I have created a new entity ProviderLog to store details of the request.**\
**Since we have multiple providers, I had in mind not to duplicate any code between the different providers and to have a reusable way to store these details.**\
**I decided to use an AuditDecorator which would be responsible for preparing and storing these details.**\
**Unfortunately it is not working as expected as the providerLogRepository that I pass as a parameter to the @AuditDecorator is always null.**\
**I haven't been able to figure out what was the root cause of this issue. I have done some research and tried other ways to "inject" the repository (like Fastify decorators or plugins) but I wasn't successful.**\
**I have anyway written some unit tests associated to the AuditDecorator to make sure it should work as expected once this parameter issue would be fixed.**\
**If you know how to fix this issue I'd be more than happy to hear about it!**

# Miscellaneous Production readiness notes
- For the purpose of this exercise we assumed only one instance, but we'd need multiple instances to ensure fault tolerance and scalability. All instances should be behind a load balancer and each instance should provide health check to allow the load balancer to manage the instances.
- Database should be replicated to ensure fault tolerance, and we might want to introduce some mechanisms to ensure highly scalable write/read throughput like read replicas/partitioning/sharding/multiple write leaders. I have also introduced some indexes in the entities, these indexes should be verified depending on the different access patterns we'll have.
- We're getting data from the database in both the get and put operations so in order to remove some load from the DB we might want to introduce a distributing caching mechanism like Redis for the popular VRMs. We could use a basic eviction mechanism like LRU to only keep the most "hot" ones.
- It is mentioned that the PremiumCar provider is expensive, and we also want to limit burst of requests which would put too much stress on our systems, so we might want to introduce a rate limiting mechanism.
- I have implemented a basic logging mechanism (console logs) but we should collect all these logs somewhere for analysis. CloudWatch or any similar systems should be good candidates. Our instances should also emit metrics like successes and errors (per provider) so that we could build dashboards and alarms around these data.
