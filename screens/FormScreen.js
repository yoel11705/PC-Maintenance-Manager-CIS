import React, { useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { PDFDocument, rgb } from 'pdf-lib';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import * as Sharing from 'expo-sharing';
import { Buffer } from 'buffer';
import Signature from 'react-native-signature-canvas';
import ReactNativeModal from 'react-native-modal';
import DateTimePicker from '@react-native-community/datetimepicker';

const FormScreen = () => {
  const [form, setForm] = useState({
    fecha: '',
    formato: '',
    unidad_medica: '',
    area: '',
    usuario: '',
    ip: '',
    configuracion: {
      ethernet: false,
      wifi: false,
      ninguno: false,
    },
    equipo: '',
    ram: '',
    dd: '',
    marca: '',
    procesador: '',
    velocidad: '',
    n_serie: '',
    cucop: '',
    modelo: '',
    color: '',
    estado: {
      bueno: false,
      regular: false,
      malo: false,
    },
    antecedente: '',
    diagnostico: '',
    propuesta: '',
    observaciones: '',
    realizo: '',
    vo_bo: '',
    realizoSignature: null,
    voBoSignature: null,
  });

  const [isRealizoModalVisible, setRealizoModalVisible] = useState(false);
  const [isVoBoModalVisible, setVoBoModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  const handleInputChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };

  const handleCheckboxChange = (name, field) => {
    setForm({ ...form, [field]: { ...form[field], [name]: !form[field][name] } });
  };

  const drawX = (page, x, y) => {
    page.drawText('x', {
      x,
      y,
      size: 12,
      color: rgb(0, 0, 0),
    });
  };

  const handleSignature = (signature, field) => {
    setForm({ ...form, [field]: signature });
  };

  const generatePDF = async () => {
    try {
      const asset = Asset.fromModule(require('../assets/doc_cis.pdf'));
      await asset.downloadAsync();
      const existingPdfBytes = await FileSystem.readAsStringAsync(
        asset.localUri,
        { encoding: FileSystem.EncodingType.Base64 }
      );

      const pdfDoc = await PDFDocument.load(Buffer.from(existingPdfBytes, 'base64'));
      const firstPage = pdfDoc.getPages()[0];

      // Agregar texto al PDF en las posiciones específicas
      firstPage.drawText(form.fecha, { x: 70, y: 677, size: 12 });
      firstPage.drawText(form.formato, { x: 425, y: 677, size: 12 });
      firstPage.drawText(form.unidad_medica, { x: 140, y: 651, size: 12 });
      firstPage.drawText(form.area, { x: 48, y: 616, size: 12 });
      firstPage.drawText(form.usuario, { x: 58, y: 603, size: 12 });
      firstPage.drawText(form.ip, { x: 330, y: 616, size: 12 });
      if (form.configuracion.ethernet) drawX(firstPage, 389, 602);
      if (form.configuracion.wifi) drawX(firstPage, 460, 602);
      if (form.configuracion.ninguno) drawX(firstPage, 550, 602);
      firstPage.drawText(form.equipo, { x: 63, y: 580, size: 12 });
      firstPage.drawText(form.ram, { x: 280, y: 580, size: 12 });
      firstPage.drawText(form.dd, { x: 403, y: 578, size: 12 });
      firstPage.drawText(form.marca, { x: 63, y: 563, size: 12 });
      firstPage.drawText(form.procesador, { x: 298, y: 563, size: 12 });
      firstPage.drawText(form.velocidad, { x: 500, y: 563, size: 12 });
      firstPage.drawText(form.n_serie, { x: 64, y: 547, size: 12 });
      firstPage.drawText(form.cucop, { x: 417, y: 547, size: 12 });
      firstPage.drawText(form.modelo, { x: 64, y: 533, size: 12 });
      firstPage.drawText(form.color, { x: 285, y: 533, size: 12 });
      if (form.estado.bueno) drawX(firstPage, 457, 533);
      if (form.estado.regular) drawX(firstPage, 515, 533);
      if (form.estado.malo) drawX(firstPage, 565, 533);
      firstPage.drawText(form.antecedente, { x: 30, y: 500, size: 12 });
      firstPage.drawText(form.diagnostico, { x: 30, y: 433, size: 12 });
      firstPage.drawText(form.propuesta, { x: 30, y: 369, size: 12 });
      firstPage.drawText(form.observaciones, { x: 30, y: 285, size: 12 });
      firstPage.drawText(form.realizo, { x: 66, y: 90, size: 12 });
      firstPage.drawText(form.vo_bo, { x: 360, y: 90, size: 12 });

      // Agregar firmas 
      if (form.realizoSignature) {
        const realizoImageBytes = Buffer.from(form.realizoSignature.replace('data:image/png;base64,', ''), 'base64');
        const realizoImage = await pdfDoc.embedPng(realizoImageBytes);
        firstPage.drawImage(realizoImage, {
          x: 100,
          y: 110,
          width: 50,
          height: 35,
        });
      }

      if (form.voBoSignature) {
        const voBoImageBytes = Buffer.from(form.voBoSignature.replace('data:image/png;base64,', ''), 'base64');
        const voBoImage = await pdfDoc.embedPng(voBoImageBytes);
        firstPage.drawImage(voBoImage, {
          x: 410,
          y: 110,
          width: 50,
          height: 35,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
      
      const fileName = 'formulario_completado.pdf';
      const pdfPath = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(pdfPath, pdfBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // guardar 
      const downloadDir = FileSystem.downloadDirectory;
      if (downloadDir) {
        const downloadPath = `${downloadDir}${fileName}`;
        await FileSystem.copyAsync({
          from: pdfPath,
          to: downloadPath,
        });
        await Sharing.shareAsync(downloadPath);
      } else {
        await Sharing.shareAsync(pdfPath);
      }

    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      setSelectedDate(formattedDate);
      handleInputChange('fecha', formattedDate);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Datos de Diagnóstico Técnico/Mantenimiento</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)}>
        <TextInput style={styles.input} placeholder="Fecha" value={form.fecha} editable={false} />
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
      <TextInput style={styles.input} placeholder="Formato" value={form.formato} onChangeText={(value) => handleInputChange('formato', value)} />
      <TextInput style={styles.input} placeholder="Nombre de la unidad Medica" value={form.unidad_medica} onChangeText={(value) => handleInputChange('unidad_medica', value)} />
      <TextInput style={styles.input} placeholder="Área" value={form.area} onChangeText={(value) => handleInputChange('area', value)} />
      <TextInput style={styles.input} placeholder="Nombre del Usuario" value={form.usuario} onChangeText={(value) => handleInputChange('usuario', value)} />
      <TextInput style={styles.input} placeholder="IP" value={form.ip} onChangeText={(value) => handleInputChange('ip', value)} />

      <Text style={styles.sectionTitle}>Configuración:</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.checkbox, form.configuracion.ethernet && styles.checked]} onPress={() => handleCheckboxChange('ethernet', 'configuracion')}>
          <Text style={styles.checkboxLabel}>Ethernet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.checkbox, form.configuracion.wifi && styles.checked]} onPress={() => handleCheckboxChange('wifi', 'configuracion')}>
          <Text style={styles.checkboxLabel}>Wi-Fi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.checkbox, form.configuracion.ninguno && styles.checked]} onPress={() => handleCheckboxChange('ninguno', 'configuracion')}>
          <Text style={styles.checkboxLabel}>Ninguno</Text>
        </TouchableOpacity>
      </View>

      <TextInput style={styles.input} placeholder="Equipo" value={form.equipo} onChangeText={(value) => handleInputChange('equipo', value)} />
      <TextInput style={styles.input} placeholder="RAM" value={form.ram} onChangeText={(value) => handleInputChange('ram', value)} />
      <TextInput style={styles.input} placeholder="DD" value={form.dd} onChangeText={(value) => handleInputChange('dd', value)} />
      <TextInput style={styles.input} placeholder="Marca" value={form.marca} onChangeText={(value) => handleInputChange('marca', value)} />
      <TextInput style={styles.input} placeholder="Procesador" value={form.procesador} onChangeText={(value) => handleInputChange('procesador', value)} />
      <TextInput style={styles.input} placeholder="Velocidad" value={form.velocidad} onChangeText={(value) => handleInputChange('velocidad', value)} />
      <TextInput style={styles.input} placeholder="Número de Serie" value={form.n_serie} onChangeText={(value) => handleInputChange('n_serie', value)} />
      <TextInput style={styles.input} placeholder="CUCOP" value={form.cucop} onChangeText={(value) => handleInputChange('cucop', value)} />
      <TextInput style={styles.input} placeholder="Modelo" value={form.modelo} onChangeText={(value) => handleInputChange('modelo', value)} />
      <TextInput style={styles.input} placeholder="Color" value={form.color} onChangeText={(value) => handleInputChange('color', value)} />

      <Text style={styles.sectionTitle}>Estado:</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.checkbox, form.estado.bueno && styles.checked]} onPress={() => handleCheckboxChange('bueno', 'estado')}>
          <Text style={styles.checkboxLabel}>Bueno</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.checkbox, form.estado.regular && styles.checked]} onPress={() => handleCheckboxChange('regular', 'estado')}>
          <Text style={styles.checkboxLabel}>Regular</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.checkbox, form.estado.malo && styles.checked]} onPress={() => handleCheckboxChange('malo', 'estado')}>
          <Text style={styles.checkboxLabel}>Malo</Text>
        </TouchableOpacity>
      </View>

      <TextInput style={styles.input} placeholder="Antecedente" value={form.antecedente} onChangeText={(value) => handleInputChange('antecedente', value)} multiline numberOfLines={4} />
      <TextInput style={styles.input} placeholder="Diagnóstico" value={form.diagnostico} onChangeText={(value) => handleInputChange('diagnostico', value)} multiline numberOfLines={4} />
      <TextInput style={styles.input} placeholder="Propuesta" value={form.propuesta} onChangeText={(value) => handleInputChange('propuesta', value)} multiline numberOfLines={4} />
      <TextInput style={styles.input} placeholder="Observaciones" value={form.observaciones} onChangeText={(value) => handleInputChange('observaciones', value)} multiline numberOfLines={4} />

      <TextInput style={styles.input} placeholder="Realizó" value={form.realizo} onChangeText={(value) => handleInputChange('realizo', value)} />

      <TouchableOpacity onPress={() => setRealizoModalVisible(true)}>
        <Text style={styles.signatureButton}>Agregar Firma Realizó</Text>
      </TouchableOpacity>

      <TextInput style={styles.input} placeholder="Vo Bo" value={form.vo_bo} onChangeText={(value) => handleInputChange('vo_bo', value)} />

      <TouchableOpacity onPress={() => setVoBoModalVisible(true)}>
        <Text style={styles.signatureButton}>Agregar Firma Vo Bo</Text>
      </TouchableOpacity>

      <ReactNativeModal isVisible={isRealizoModalVisible}>
        <View style={styles.modalContent}>
          <Signature
            onOK={(signature) => {
              handleSignature(signature, 'realizoSignature');
              setRealizoModalVisible(false);
            }}
            onClear={() => handleSignature(null, 'realizoSignature')}
          />
          <Button title="Cerrar" onPress={() => setRealizoModalVisible(false)} />
        </View>
      </ReactNativeModal>

      <ReactNativeModal isVisible={isVoBoModalVisible}>
        <View style={styles.modalContent}>
          <Signature
            onOK={(signature) => {
              handleSignature(signature, 'voBoSignature');
              setVoBoModalVisible(false);
            }}
            onClear={() => handleSignature(null, 'voBoSignature')}
          />
          <Button title="Cerrar" onPress={() => setVoBoModalVisible(false)} />
        </View>
      </ReactNativeModal>

      <TouchableOpacity style={styles.generateButton} onPress={generatePDF}>
        <Text style={styles.generateButtonText}>Generar PDF</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f0f0f0',
    flexGrow: 1,
    marginHorizontal: 5,
  },
  checked: {
    backgroundColor: '#0ac1ff',
  },
  checkboxLabel: {
    marginLeft: 10,
    fontWeight: 'bold',
    color: '#000000',
  },
  signatureButton: {
    color: '#007bff',
    textAlign: 'center',
    marginVertical: 10,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    height: '55%',
    width: '100%',
  },
  generateButton: {
    backgroundColor: '#000080', 
    paddingVertical: 14, 
    paddingHorizontal: 20, 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 20, 
  },
  generateButtonText: {
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold', 
  },
});

export default FormScreen;
