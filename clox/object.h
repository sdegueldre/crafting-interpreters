#ifndef clox_object_h
#define clox_object_h

#include "common.h"
#include "value.h"

typedef enum {
  OBJ_STRING,
} ObjType;

typedef struct Obj Obj;
struct Obj {
  ObjType type;
  Obj* next;  // intrusive list for GC
};

typedef struct ObjString {
  Obj obj;
  int length;
  char* chars;
  uint32_t hash;
} ObjString;

#define ALLOCATE_OBJ(type, objectType) \
  (type*)allocateObject(sizeof(type), objectType)

#define IS_STRING(val) (isObjectType(val, OBJ_STRING))
#define AS_STRING(val) ((ObjString*)(val))

ObjString* copyString(const char*, int);
void printObj(Obj*);
void freeObject(Obj*);
bool isObjectType(Value, ObjType);
ObjString* takeString(char* chars, int length);

#endif
