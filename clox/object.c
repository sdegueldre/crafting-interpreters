#include "object.h"

#include <stdio.h>
#include <string.h>

#include "memory.h"
#include "vm.h"

extern VM vm;

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
static ObjString* allocateString(char* chars, int length, uint32_t hash) {
  ObjString* str = ALLOCATE_OBJ(ObjString, OBJ_STRING);
  str->length = length;
  str->chars = chars;
  str->hash = hash;
  tableSet(&vm.strings, str, NIL_VAL);
  return str;
}

static uint32_t hashString(const char* key, int length) {
  uint32_t hash = 2166136261u;
  for (int i = 0; i < length; i++) {
    hash ^= (uint8_t)key[i];
    hash *= 16777619;
  }
  return hash;
}

ObjString* copyString(const char* chars, int length) {
  uint32_t hash = hashString(chars, length);
  ObjString* interned = tableFindString(&vm.strings, chars, length, hash);
  if (interned != NULL) {
    return interned;
  }
  char* charsCopy = ALLOCATE(char, length + 1);
  memcpy(charsCopy, chars, length);
  charsCopy[length] = '\0';
  return allocateString(charsCopy, length, hash);
}

ObjString* takeString(char* chars, int length) {
  uint32_t hash = hashString(chars, length);
  ObjString* interned = tableFindString(&vm.strings, chars, length, hash);
  if (interned != NULL) {
    FREE_ARRAY(char, chars, length + 1);
    return interned;
  }
  return allocateString(chars, length, hash);
}

void printObj(Obj* obj) {
  switch (obj->type) {
    case OBJ_STRING:
      printf("%s", AS_STRING(obj)->chars);
  }
}