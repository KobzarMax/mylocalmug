import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { LoyaltyProgram, LoyaltyProgramInput, MenuChoice } from '../types';
import { rewardColors, rewardStyles as s } from '../styles';
import { RewardHeader } from './RewardUI';

type Props={program:LoyaltyProgram|null;menu:MenuChoice[];busy:boolean;onBack:()=>void;onSave:(input:LoyaltyProgramInput)=>Promise<unknown>};
export function ProgrammeForm({program,menu,busy,onBack,onSave}:Props){
 const[type,setType]=useState<'stamp'|'points'>(program?.type??'stamp');
 const[method,setMethod]=useState<'item'|'spend'>(program?.earningMethod??'item');
 const[name,setName]=useState(program?.name??'');const[description,setDescription]=useState(program?.description??'');
 const[singular,setSingular]=useState(program?.unitSingular??'stamp');const[plural,setPlural]=useState(program?.unitPlural??'stamps');
 const[rate,setRate]=useState(String(program?.pointsPerPound??1));const[startsAt,setStartsAt]=useState(program?.startsAt??'');const[endsAt,setEndsAt]=useState(program?.endsAt??'');
 const[terms,setTerms]=useState(program?.terms??'Earn progress only on staff-verified purchases. Rewards have no cash value and are non-transferable.');
 const[selected,setSelected]=useState((program?.eligibility??[]).flatMap(entry=>entry.menuItemId?[entry.menuItemId]:[]));
 const[selectedCategories,setSelectedCategories]=useState((program?.eligibility??[]).flatMap(entry=>entry.categoryId?[entry.categoryId]:[]));
 const[units,setUnits]=useState<Record<string,string>>(Object.fromEntries((program?.eligibility??[]).map(entry=>[entry.menuItemId??entry.categoryId??'',String(entry.unitsPerItem)])));
 const[tiers,setTiers]=useState((program?.tiers??[]).map(tier=>`${tier.name}: ${tier.threshold}`).join('\n'));
 const grouped=useMemo(()=>Object.entries(menu.reduce<Record<string,MenuChoice[]>>((all,item)=>{(all[item.categoryName]??=[]).push(item);return all;},{})),[menu]);
 const selectType=(value:'stamp'|'points')=>{setType(value);if(value==='stamp')setMethod('item');setSingular(value==='stamp'?'stamp':'point');setPlural(value==='stamp'?'stamps':'points');};
 const submit=async()=>{try{await onSave({type,name,description,unitSingular:singular,unitPlural:plural,earningMethod:type==='stamp'?'item':method,pointsPerPound:method==='spend'?Number(rate):null,terms,effectiveAt:new Date().toISOString(),startsAt:startsAt.trim()||null,endsAt:endsAt.trim()||null,eligibility:[...selected.map(menuItemId=>({menuItemId,unitsPerItem:Number(units[menuItemId]??1)})),...selectedCategories.map(categoryId=>({categoryId,unitsPerItem:Number(units[categoryId]??1)}))],tiers:tiers.split('\n').filter(Boolean).map((line,index)=>{const[label,value]=line.split(':');return{name:label.trim(),threshold:Number(value?.trim()),sortOrder:index};})});onBack();}catch(caught){Alert.alert('Could not save programme',caught instanceof Error?caught.message:'Check the programme details.');}};
 return <ScrollView contentContainerStyle={s.scroll}>
  <RewardHeader title={program?'New programme version':'Create programme'} onBack={onBack}/><Text style={s.intro}>Choose a proven earning model. Material edits create a new auditable version.</Text>
  <Text style={s.label}>Programme type</Text><View style={s.wrap}>{(['stamp','points'] as const).map(value=><Chip key={value} label={value} active={type===value} onPress={()=>selectType(value)}/>)}</View>
  {type==='points'&&<><Text style={s.sectionTitle}>Earning method</Text><View style={s.wrap}>{(['item','spend'] as const).map(value=><Chip key={value} label={value==='item'?'Points per item':'Points per £1'} active={method===value} onPress={()=>setMethod(value)}/>)}</View></>}
  <Field label="Name" value={name} onChangeText={setName}/><Field label="Description" value={description} onChangeText={setDescription} multiline/>
  <View style={s.row}><View style={{flex:1}}><Field label="Singular unit" value={singular} onChangeText={setSingular}/></View><View style={{flex:1}}><Field label="Plural unit" value={plural} onChangeText={setPlural}/></View></View>
  {method==='spend'&&<Field label="Points per £1" value={rate} onChangeText={setRate} keyboardType="number-pad"/>}
  {method==='item'&&<><Text style={s.sectionTitle}>Eligible categories</Text><View style={s.wrap}>{grouped.flatMap(([,items])=>items[0]?.categoryId?[items[0]]:[]).map(item=><Chip key={item.categoryId!} label={item.categoryName} active={selectedCategories.includes(item.categoryId!)} onPress={()=>setSelectedCategories(current=>current.includes(item.categoryId!)?current.filter(id=>id!==item.categoryId):[...current,item.categoryId!])}/>)}</View><Text style={s.sectionTitle}>Eligible individual items</Text>{grouped.map(([category,items])=><View key={category}><Text style={s.label}>{category}</Text><View style={s.wrap}>{items.map(item=><Chip key={item.id} label={item.name} active={selected.includes(item.id)} onPress={()=>setSelected(current=>current.includes(item.id)?current.filter(id=>id!==item.id):[...current,item.id])}/>)}</View></View>)}{[...selectedCategories,...selected].map(id=><Field key={id} label={`Units for ${menu.find(item=>item.id===id)?.name??menu.find(item=>item.categoryId===id)?.categoryName??'selection'}`} value={units[id]??'1'} onChangeText={value=>setUnits(current=>({...current,[id]:value}))} keyboardType="number-pad"/>)}</>}
  <Text style={s.sectionTitle}>Schedule</Text><Text style={s.meta}>Use an ISO date/time including its offset. Leave blank to publish manually.</Text><Field label="Starts at" value={startsAt} onChangeText={setStartsAt} placeholder="2026-09-01T08:00:00+01:00"/><Field label="Ends at" value={endsAt} onChangeText={setEndsAt} placeholder="Optional"/>
  <Text style={s.sectionTitle}>Loyalty tiers</Text><Text style={s.meta}>One per line, for example “Silver: 100”. Unlocked tiers never disappear through redemption.</Text><TextInput style={[s.field,{minHeight:100,textAlignVertical:'top'}]} multiline value={tiers} onChangeText={setTiers}/>
  <Field label="Customer terms" value={terms} onChangeText={setTerms} multiline/><View style={s.row}><Switch value disabled trackColor={{true:rewardColors.mint}}/><Text style={[s.meta,{flex:1}]}>Balances do not expire. Pausing stops earning but keeps redemption available.</Text></View>
  <Pressable disabled={busy} onPress={submit} style={[s.primary,busy&&s.disabled]}><Text style={s.primaryText}>{busy?'Saving…':'Save draft'}</Text></Pressable>
 </ScrollView>;
}
function Chip({label,active,onPress}:{label:string;active:boolean;onPress:()=>void}){return <Pressable onPress={onPress} style={[s.chip,active&&s.chipActive]}><Text style={[s.chipText,active&&s.chipTextActive]}>{label}</Text></Pressable>}
function Field(props:React.ComponentProps<typeof TextInput>&{label:string}){const{label,...input}=props;return <View style={{marginTop:14}}><Text style={s.label}>{label}</Text><TextInput placeholderTextColor={rewardColors.muted} style={[s.field,input.multiline&&{minHeight:90,textAlignVertical:'top'}]} {...input}/></View>}
