
export default [
  {
    "unitID": 1,
    "costs": {
      "metal": 60,
      "crystal": 15,
      "deuterium": 0,
      "energy": 0,
      "factor": 1.5
    },
    "requirements": []
  },
  {
    "unitID": 2,
    "costs": {
      "metal": 48,
      "crystal": 24,
      "deuterium": 0,
      "energy": 0,
      "factor": 1.6
    },
    "requirements": []
  },
  {
    "unitID": 3,
    "costs": {
      "metal": 225,
      "crystal": 75,
      "deuterium": 0,
      "energy": 0,
      "factor": 1.5
    },
    "requirements": []
  },
  {
    "unitID": 4,
    "costs": {
      "metal": 75,
      "crystal": 30,
      "deuterium": 0,
      "energy": 0,
      "factor": 1.5
    },
    "requirements": []
  },
  {
    "unitID": 5,
    "costs": {
      "metal": 900,
      "crystal": 360,
      "deuterium": 180,
      "energy": 0,
      "factor": 1.8
    },
    "requirements": [
      {
        "unitID": 3,
        "level": 5 //                                    >= 5
      },
      {
        "unitID": 106,
        "level": 3 //                                    >= 3
      }
    ]
  },
  {
    "unitID": 6,
    "costs": {
      "metal": 400,
      "crystal": 120,
      "deuterium": 200,
      "energy": 0,
      "factor": 2
    },
    "requirements": []
  },
  {
    "unitID": 7,
    "costs": {
      "metal": 1000000,
      "crystal": 500000,
      "deuterium": 100000,
      "energy": 0,
      "factor": 2
    },
    "requirements": [
      {
        "unitID": 6,
        "level": 10
      },
      {
        "unitID": 102,
        "level": 10
      }
    ]
  },
  {
    "unitID": 8,
    "costs": {
      "metal": 400,
      "crystal": 200,
      "deuterium": 100,
      "energy": 0,
      "factor": 2
    },
    "requirements": [
      {
        "unitID": 6,
        "level": 2 //                             >= 2
      }
    ]
  },
  {
    "unitID": 9,
    "costs": {
      "metal": 1000,
      "crystal": 0,
      "deuterium": 0,
      "energy": 0,
      "factor": 2
    },
    "requirements": []
  },
  {
    "unitID": 10,
    "costs": {
      "metal": 1000,
      "crystal": 500,
      "deuterium": 0,
      "energy": 0,
      "factor": 2
    },
    "requirements": []
  },
  {
    "unitID": 11,
    "costs": {
      "metal": 1000,
      "crystal": 1000,
      "deuterium": 0,
      "energy": 0,
      "factor": 2
    },
    "requirements": []
  },
  {
    "unitID": 12,
    "costs": {
      "metal": 200,
      "crystal": 400,
      "deuterium": 200,
      "energy": 0,
      "factor": 2
    },
    "requirements": []
  },
  {
    "unitID": 13,
    "costs": {
      "metal": 0,
      "crystal": 50000,
      "deuterium": 100000,
      "energy": 1000,
      "factor": 2
    },
    "requirements": [
      {
        "unitID": 7,
        "level": 1 //                                    >= 1
      },
      {
        "unitID": 106,
        "level": 12 //                                    >= 12
      }
    ]
  },
  {
    "unitID": 14,
    "costs": {
      "metal": 20000,
      "crystal": 40000,
      "deuterium": 0,
      "energy": 0,
      "factor": 2
    },
    "requirements": []
  },
  {
    "unitID": 15,
    "costs": {
      "metal": 20000,
      "crystal": 20000,
      "deuterium": 1000,
      "energy": 0,
      "factor": 2
    },
    "requirements": []
  }
];
