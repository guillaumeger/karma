import { useState, useEffect, useCallback } from "react";

import { MockAPIResponse, MockSilenceResponse } from "__mocks__/Fetch";

const MockFetchStats = {
  getCalls: [],
  get calls() {
    return this.getCalls;
  },
  wasCalled(uri) {
    this.getCalls.push(uri);
  },
  reset() {
    this.getCalls = [];
  },
};

const Mock = (uri, { autorun = true, deps = [] } = {}) => {
  const [response, setResponse] = useState(null);
  const [error] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying] = useState(false);

  const get = useCallback(() => {
    MockFetchStats.wasCalled(uri);

    const mockResponses = [
      // matcher name select suggestions
      {
        uri: "./labelNames.json",
        response: ["cluster", "job", "instance"],
      },
      // matcher value select suggestions
      {
        uri: "./labelValues.json?name=cluster",
        response: ["dev", "staging", "prod"],
      },
      // matcher value counters
      {
        re: /^\.\/alerts\.json\?q=/,
        response: MockAPIResponse(),
      },
      // silence browser
      {
        re: /^.\/silences\.json\?/,
        response: MockSilenceResponse("am", 14),
      },
      // filter autocomplete
      {
        uri: "./autocomplete.json?term=cluster",
        response: [
          "cluster=staging",
          "cluster=prod",
          "cluster=dev",
          "cluster!=staging",
          "cluster!=prod",
          "cluster!=dev",
        ],
      },
      {
        re: /^.\/autocomplete\.json\?term=/,
        response: ["foo=bar", "foo=~bar"],
      },
    ];

    for (const m of mockResponses) {
      if (m.re && uri.match(m.re)) {
        setResponse(m.response);
        setIsLoading(false);
        break;
      } else if (m.uri === uri) {
        setResponse(m.response);
        setIsLoading(false);
        break;
      }
    }
  }, [uri]);

  useEffect(() => {
    if (autorun) get();
    // eslint doesn't like ...deps
    // eslint-disable-next-line
  }, [uri, get, autorun, ...deps]);

  return { response, error, isLoading, isRetrying, get };
};

const useFetchGet = jest.fn(Mock);
useFetchGet.fetch = MockFetchStats;
useFetchGet.mockReset = () => {
  useFetchGet.mockClear();
  useFetchGet.mockImplementation(Mock);
  MockFetchStats.reset();
};

export { useFetchGet };
