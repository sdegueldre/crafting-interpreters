#include "object.h"

#include <stdio.h>
#include <string.h>

#include "memory.h"
#include "vm.h"

extern VM vm;

static void freeString(ObjString* str);

Obj* allocateObject(size_t size, ObjType type) {
  Obj* obj = reallocate(NULL, 0, size);
  obj->type = type;
  obj->next = vm.objects;
  vm.objects = obj;
  return obj;
}

void freeObject(Obj* obj) {
  switch (obj->type) {
    case OBJ_STRING: {
      ObjString* str = AS_STRING(obj);
      FREE_ARRAY(char, str->chars, str->length + 1);
      reallocate(str, sizeof(str), 0);
      break;
    }
  }
}

bool isObjectType(Value val, ObjType type) {
  return IS_OBJ(val) && AS_OBJ(val)->type == type;
}

/**
 * Takes ownership of chars
 */
static ObjString* allocateString(char* chars, int length) {
  ObjString* str = ALLOCATE_OBJ(ObjString, OBJ_STRING);
  str->length = length;
  str->chars = chars;
  return str;
}

static void freeString(ObjString* str) {
}

ObjString* copyString(const char* chars, int length) {
  char* charsCopy = ALLOCATE(char, length + 1);
  memcpy(charsCopy, chars, length);
  charsCopy[length] = '\0';
  return allocateString(charsCopy, length);
}

ObjString* takeString(char* chars, int length) {
  return allocateString(chars, length);
}

void printObj(Obj* obj) {
  switch (obj->type) {
    case OBJ_STRING:
      printf("%s", AS_STRING(obj)->chars);
  }
}