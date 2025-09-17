package state

import "sync"

var MP sync.Map

var Grid [][][]int
var GridMutex sync.Mutex
